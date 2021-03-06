/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import * as Common from '../common/common.js';
import * as SDK from '../sdk/sdk.js';
import * as Workspace from '../workspace/workspace.js';
import { DebuggerWorkspaceBinding } from './DebuggerWorkspaceBinding.js'; // eslint-disable-line no-unused-vars
import { LiveLocationPool } from './LiveLocation.js'; // eslint-disable-line no-unused-vars
/**
 * @type {!BreakpointManager}
 */
let breakpointManagerInstance;
export class BreakpointManager extends Common.ObjectWrapper.ObjectWrapper {
    /**
     * @private
     * @param {!SDK.SDKModel.TargetManager} targetManager
     * @param {!Workspace.Workspace.WorkspaceImpl} workspace
     * @param {!DebuggerWorkspaceBinding} debuggerWorkspaceBinding
     */
    constructor(targetManager, workspace, debuggerWorkspaceBinding) {
        super();
        this._storage = new Storage();
        this._workspace = workspace;
        this._targetManager = targetManager;
        this._debuggerWorkspaceBinding = debuggerWorkspaceBinding;
        /** @type {!Map<!Workspace.UISourceCode.UISourceCode, !Map<string, !BreakpointLocation>>} */
        this._breakpointsForUISourceCode = new Map();
        /** @type {!Map<string, !Breakpoint>} */
        this._breakpointByStorageId = new Map();
        this._workspace.addEventListener(Workspace.Workspace.Events.UISourceCodeAdded, this._uiSourceCodeAdded, this);
        this._workspace.addEventListener(Workspace.Workspace.Events.UISourceCodeRemoved, this._uiSourceCodeRemoved, this);
        this._workspace.addEventListener(Workspace.Workspace.Events.ProjectRemoved, this._projectRemoved, this);
    }
    /**
     * @param {{forceNew: ?boolean, targetManager: ?SDK.SDKModel.TargetManager, workspace: ?Workspace.Workspace.WorkspaceImpl, debuggerWorkspaceBinding: ?DebuggerWorkspaceBinding}} opts
     */
    static instance(opts = { forceNew: null, targetManager: null, workspace: null, debuggerWorkspaceBinding: null }) {
        const { forceNew, targetManager, workspace, debuggerWorkspaceBinding } = opts;
        if (!breakpointManagerInstance || forceNew) {
            if (!targetManager || !workspace || !debuggerWorkspaceBinding) {
                throw new Error(`Unable to create settings: targetManager, workspace, and debuggerWorkspaceBinding must be provided: ${new Error().stack}`);
            }
            breakpointManagerInstance = new BreakpointManager(targetManager, workspace, debuggerWorkspaceBinding);
        }
        return breakpointManagerInstance;
    }
    /**
     * @param {string} url
     * @param {number} lineNumber
     * @param {number=} columnNumber
     * @return {string}
     */
    static _breakpointStorageId(url, lineNumber, columnNumber) {
        if (!url) {
            return '';
        }
        return `${url}:${lineNumber}` + (typeof columnNumber === 'number' ? `:${columnNumber}` : '');
    }
    /**
     * @param {string} fromURL
     * @param {!Workspace.UISourceCode.UISourceCode} toSourceCode
     */
    async copyBreakpoints(fromURL, toSourceCode) {
        const breakpointItems = this._storage.breakpointItems(fromURL);
        for (const item of breakpointItems) {
            await this.setBreakpoint(toSourceCode, item.lineNumber, item.columnNumber, item.condition, item.enabled);
        }
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     */
    _restoreBreakpoints(uiSourceCode) {
        const url = uiSourceCode.url();
        if (!url) {
            return;
        }
        this._storage.mute();
        const breakpointItems = this._storage.breakpointItems(url);
        for (const item of breakpointItems) {
            this._innerSetBreakpoint(uiSourceCode, item.lineNumber, item.columnNumber, item.condition, item.enabled);
        }
        this._storage.unmute();
    }
    /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
    _uiSourceCodeAdded(event) {
        const uiSourceCode = /** @type {!Workspace.UISourceCode.UISourceCode} */ (event.data);
        this._restoreBreakpoints(uiSourceCode);
    }
    /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
    _uiSourceCodeRemoved(event) {
        const uiSourceCode = /** @type {!Workspace.UISourceCode.UISourceCode} */ (event.data);
        this._removeUISourceCode(uiSourceCode);
    }
    /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
    _projectRemoved(event) {
        const project = /** @type {!Workspace.Workspace.Project} */ (event.data);
        for (const uiSourceCode of project.uiSourceCodes()) {
            this._removeUISourceCode(uiSourceCode);
        }
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     */
    _removeUISourceCode(uiSourceCode) {
        const breakpoints = this.breakpointLocationsForUISourceCode(uiSourceCode);
        breakpoints.forEach(bp => bp.breakpoint.removeUISourceCode(uiSourceCode));
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @param {number} lineNumber
     * @param {number|undefined} columnNumber
     * @param {string} condition
     * @param {boolean} enabled
     * @return {!Promise<!Breakpoint>}
     */
    async setBreakpoint(uiSourceCode, lineNumber, columnNumber, condition, enabled) {
        let uiLocation = new Workspace.UISourceCode.UILocation(uiSourceCode, lineNumber, columnNumber);
        const normalizedLocation = await this._debuggerWorkspaceBinding.normalizeUILocation(uiLocation);
        if (normalizedLocation.id() !== uiLocation.id()) {
            Common.Revealer.reveal(normalizedLocation);
            uiLocation = normalizedLocation;
        }
        return this._innerSetBreakpoint(uiLocation.uiSourceCode, uiLocation.lineNumber, uiLocation.columnNumber, condition, enabled);
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @param {number} lineNumber
     * @param {number|undefined} columnNumber
     * @param {string} condition
     * @param {boolean} enabled
     * @return {!Breakpoint}
     */
    _innerSetBreakpoint(uiSourceCode, lineNumber, columnNumber, condition, enabled) {
        const itemId = BreakpointManager._breakpointStorageId(uiSourceCode.url(), lineNumber, columnNumber);
        let breakpoint = this._breakpointByStorageId.get(itemId);
        if (breakpoint) {
            breakpoint._updateState(condition, enabled);
            breakpoint.addUISourceCode(uiSourceCode);
            breakpoint._updateBreakpoint();
            return breakpoint;
        }
        breakpoint = new Breakpoint(this, uiSourceCode, uiSourceCode.url(), lineNumber, columnNumber, condition, enabled);
        this._breakpointByStorageId.set(itemId, breakpoint);
        return breakpoint;
    }
    /**
     * @param {!Workspace.UISourceCode.UILocation} uiLocation
     * @return {?BreakpointLocation}
     */
    findBreakpoint(uiLocation) {
        const breakpoints = this._breakpointsForUISourceCode.get(uiLocation.uiSourceCode);
        return breakpoints ? (breakpoints.get(uiLocation.id())) || null : null;
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @param {!TextUtils.TextRange.TextRange} textRange
     * @return {!Promise<!Array<!Workspace.UISourceCode.UILocation>>}
     */
    async possibleBreakpoints(uiSourceCode, textRange) {
        const { pluginManager } = this._debuggerWorkspaceBinding;
        if (pluginManager) {
            // TODO(bmeurer): Refactor this logic, as for DWARF and sourcemaps, it doesn't make sense
            //                to even ask V8 for possible break locations, since these are determined
            //                from the debugging information.
            const rawLocations = await pluginManager.uiLocationToRawLocations(uiSourceCode, textRange.startLine);
            if (rawLocations) {
                const uiLocations = [];
                for (const rawLocation of rawLocations) {
                    const uiLocation = await this._debuggerWorkspaceBinding.rawLocationToUILocation(rawLocation);
                    if (uiLocation) {
                        uiLocations.push(uiLocation);
                    }
                }
                return uiLocations;
            }
        }
        const startLocationsPromise = DebuggerWorkspaceBinding.instance().uiLocationToRawLocations(uiSourceCode, textRange.startLine, textRange.startColumn);
        const endLocationsPromise = DebuggerWorkspaceBinding.instance().uiLocationToRawLocations(uiSourceCode, textRange.endLine, textRange.endColumn);
        const [startLocations, endLocations] = await Promise.all([startLocationsPromise, endLocationsPromise]);
        const endLocationByModel = new Map();
        for (const location of endLocations) {
            endLocationByModel.set(location.debuggerModel, location);
        }
        let startLocation = null;
        let endLocation = null;
        for (const location of startLocations) {
            const endLocationCandidate = endLocationByModel.get(location.debuggerModel);
            if (endLocationCandidate) {
                startLocation = location;
                endLocation = endLocationCandidate;
                break;
            }
        }
        if (!startLocation || !endLocation) {
            return [];
        }
        return startLocation.debuggerModel
            .getPossibleBreakpoints(startLocation, endLocation, /* restrictToFunction */ false)
            .then(toUILocations.bind(this));
        /**
         * @this {!BreakpointManager}
         * @param {!Array<!SDK.DebuggerModel.BreakLocation>} locations
         * @return {!Promise<!Array<!Workspace.UISourceCode.UILocation>>}
         */
        async function toUILocations(locations) {
            const sortedLocationsPromises = locations.map(location => this._debuggerWorkspaceBinding.rawLocationToUILocation(location));
            const nullableLocations = await Promise.all(sortedLocationsPromises);
            const sortedLocations = /** @type {!Array<!Workspace.UISourceCode.UILocation>} */ (nullableLocations.filter(location => location && location.uiSourceCode === uiSourceCode));
            if (!sortedLocations.length) {
                return [];
            }
            sortedLocations.sort(Workspace.UISourceCode.UILocation.comparator);
            let lastLocation = sortedLocations[0];
            const result = [lastLocation];
            for (const location of sortedLocations) {
                if (location.id() !== lastLocation.id()) {
                    result.push(location);
                    lastLocation = location;
                }
            }
            return result;
        }
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @return {!Array<!BreakpointLocation>}
     */
    breakpointLocationsForUISourceCode(uiSourceCode) {
        const breakpoints = this._breakpointsForUISourceCode.get(uiSourceCode);
        return breakpoints ? Array.from(breakpoints.values()) : [];
    }
    /**
     * @return {!Array<!BreakpointLocation>}
     */
    allBreakpointLocations() {
        const result = [];
        for (const breakpoints of this._breakpointsForUISourceCode.values()) {
            result.push(...breakpoints.values());
        }
        return result;
    }
    /**
     * @param {!Breakpoint} breakpoint
     * @param {boolean} removeFromStorage
     */
    _removeBreakpoint(breakpoint, removeFromStorage) {
        if (removeFromStorage) {
            this._storage._removeBreakpoint(breakpoint);
        }
        this._breakpointByStorageId.delete(breakpoint._breakpointStorageId());
    }
    /**
     * @param {!Breakpoint} breakpoint
     * @param {!Workspace.UISourceCode.UILocation} uiLocation
     */
    _uiLocationAdded(breakpoint, uiLocation) {
        let breakpoints = this._breakpointsForUISourceCode.get(uiLocation.uiSourceCode);
        if (!breakpoints) {
            breakpoints = new Map();
            this._breakpointsForUISourceCode.set(uiLocation.uiSourceCode, breakpoints);
        }
        const breakpointLocation = { breakpoint: breakpoint, uiLocation: uiLocation };
        breakpoints.set(uiLocation.id(), breakpointLocation);
        this.dispatchEventToListeners(Events.BreakpointAdded, breakpointLocation);
    }
    /**
     * @param {!Breakpoint} breakpoint
     * @param {!Workspace.UISourceCode.UILocation} uiLocation
     */
    _uiLocationRemoved(breakpoint, uiLocation) {
        const breakpoints = this._breakpointsForUISourceCode.get(uiLocation.uiSourceCode);
        if (!breakpoints) {
            return;
        }
        const breakpointLocation = breakpoints.get(uiLocation.id()) || null;
        if (!breakpointLocation) {
            return;
        }
        breakpoints.delete(uiLocation.id());
        if (breakpoints.size === 0) {
            this._breakpointsForUISourceCode.delete(uiLocation.uiSourceCode);
        }
        this.dispatchEventToListeners(Events.BreakpointRemoved, { breakpoint: breakpoint, uiLocation: uiLocation });
    }
}
/** @enum {symbol} */
export const Events = {
    BreakpointAdded: Symbol('breakpoint-added'),
    BreakpointRemoved: Symbol('breakpoint-removed')
};
/**
 * @implements {SDK.SDKModel.SDKModelObserver<!SDK.DebuggerModel.DebuggerModel>}
 */
export class Breakpoint {
    /**
     * @param {!BreakpointManager} breakpointManager
     * @param {!Workspace.UISourceCode.UISourceCode} primaryUISourceCode
     * @param {string} url
     * @param {number} lineNumber
     * @param {number|undefined} columnNumber
     * @param {string} condition
     * @param {boolean} enabled
     */
    constructor(breakpointManager, primaryUISourceCode, url, lineNumber, columnNumber, condition, enabled) {
        this._breakpointManager = breakpointManager;
        this._url = url;
        this._lineNumber = lineNumber;
        this._columnNumber = columnNumber;
        /** @type {!Set<!Workspace.UISourceCode.UILocation>} */
        this._uiLocations = new Set(); // Bound locations
        /** @type {!Set<!Workspace.UISourceCode.UISourceCode>} */
        this._uiSourceCodes = new Set(); // All known UISourceCodes with this url
        /** @type {string} */ this._condition;
        /** @type {boolean} */ this._enabled;
        /** @type {boolean} */ this._isRemoved;
        /** @type {?Breakpoint.State} */
        this._currentState = null;
        /** @type {!Map.<!SDK.DebuggerModel.DebuggerModel, !ModelBreakpoint>}*/
        this._modelBreakpoints = new Map();
        this._updateState(condition, enabled);
        this.addUISourceCode(primaryUISourceCode);
        this._breakpointManager._targetManager.observeModels(SDK.DebuggerModel.DebuggerModel, this);
    }
    /**
     * @return {!Promise<void>}
     */
    async refreshInDebugger() {
        if (!this._isRemoved) {
            const breakpoints = Array.from(this._modelBreakpoints.values());
            await Promise.all(breakpoints.map(breakpoint => breakpoint._refreshBreakpoint()));
        }
    }
    /**
     * @override
     * @param {!SDK.DebuggerModel.DebuggerModel} debuggerModel
     */
    modelAdded(debuggerModel) {
        const debuggerWorkspaceBinding = this._breakpointManager._debuggerWorkspaceBinding;
        this._modelBreakpoints.set(debuggerModel, new ModelBreakpoint(debuggerModel, this, debuggerWorkspaceBinding));
    }
    /**
     * @override
     * @param {!SDK.DebuggerModel.DebuggerModel} debuggerModel
     */
    modelRemoved(debuggerModel) {
        const modelBreakpoint = this._modelBreakpoints.get(debuggerModel);
        this._modelBreakpoints.delete(debuggerModel);
        if (!modelBreakpoint) {
            return;
        }
        modelBreakpoint._cleanUpAfterDebuggerIsGone();
        modelBreakpoint._removeEventListeners();
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     */
    addUISourceCode(uiSourceCode) {
        if (!this._uiSourceCodes.has(uiSourceCode)) {
            this._uiSourceCodes.add(uiSourceCode);
            if (!this.bound()) {
                this._breakpointManager._uiLocationAdded(this, this._defaultUILocation(uiSourceCode));
            }
        }
    }
    clearUISourceCodes() {
        if (!this.bound()) {
            this._removeAllUnboundLocations();
        }
        this._uiSourceCodes.clear();
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     */
    removeUISourceCode(uiSourceCode) {
        if (this._uiSourceCodes.has(uiSourceCode)) {
            this._uiSourceCodes.delete(uiSourceCode);
            if (!this.bound()) {
                this._breakpointManager._uiLocationRemoved(this, this._defaultUILocation(uiSourceCode));
            }
        }
        // Do we need to do this? Not sure if bound locations will leak...
        if (this.bound()) {
            for (const uiLocation of this._uiLocations) {
                if (uiLocation.uiSourceCode === uiSourceCode) {
                    this._uiLocations.delete(uiLocation);
                    this._breakpointManager._uiLocationRemoved(this, uiLocation);
                }
            }
            if (!this.bound() && !this._isRemoved) {
                // Switch to unbound locations
                this._addAllUnboundLocations();
            }
        }
    }
    /**
     * @return {string}
     */
    url() {
        return this._url;
    }
    /**
     * @return {number}
     */
    lineNumber() {
        return this._lineNumber;
    }
    /**
     * @return {number=}
     */
    columnNumber() {
        return this._columnNumber;
    }
    /**
     * @param {!Workspace.UISourceCode.UILocation} uiLocation
     */
    _uiLocationAdded(uiLocation) {
        if (this._isRemoved) {
            return;
        }
        if (!this.bound()) {
            // This is our first bound location; remove all unbound locations
            this._removeAllUnboundLocations();
        }
        this._uiLocations.add(uiLocation);
        this._breakpointManager._uiLocationAdded(this, uiLocation);
    }
    /**
     * @param {!Workspace.UISourceCode.UILocation} uiLocation
     */
    _uiLocationRemoved(uiLocation) {
        if (this._uiLocations.has(uiLocation)) {
            this._uiLocations.delete(uiLocation);
            this._breakpointManager._uiLocationRemoved(this, uiLocation);
            if (!this.bound() && !this._isRemoved) {
                this._addAllUnboundLocations();
            }
        }
    }
    /**
     * @return {boolean}
     */
    enabled() {
        return this._enabled;
    }
    /**
     * @return {boolean}
     */
    bound() {
        return this._uiLocations.size !== 0;
    }
    /**
     * @return {boolean}
     */
    hasBoundScript() {
        for (const uiSourceCode of this._uiSourceCodes) {
            if (uiSourceCode.project().type() === Workspace.Workspace.projectTypes.Network) {
                return true;
            }
        }
        return false;
    }
    /**
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this._updateState(this._condition, enabled);
    }
    /**
     * @return {string}
     */
    condition() {
        return this._condition;
    }
    /**
     * @param {string} condition
     */
    setCondition(condition) {
        this._updateState(condition, this._enabled);
    }
    /**
     * @param {string} condition
     * @param {boolean} enabled
     */
    _updateState(condition, enabled) {
        if (this._enabled === enabled && this._condition === condition) {
            return;
        }
        this._enabled = enabled;
        this._condition = condition;
        this._breakpointManager._storage._updateBreakpoint(this);
        this._updateBreakpoint();
    }
    _updateBreakpoint() {
        if (!this.bound()) {
            this._removeAllUnboundLocations();
            if (!this._isRemoved) {
                this._addAllUnboundLocations();
            }
        }
        for (const modelBreakpoint of this._modelBreakpoints.values()) {
            modelBreakpoint._scheduleUpdateInDebugger();
        }
    }
    /**
     * @param {boolean} keepInStorage
     */
    remove(keepInStorage) {
        this._isRemoved = true;
        const removeFromStorage = !keepInStorage;
        for (const modelBreakpoint of this._modelBreakpoints.values()) {
            modelBreakpoint._scheduleUpdateInDebugger();
            modelBreakpoint._removeEventListeners();
        }
        this._breakpointManager._removeBreakpoint(this, removeFromStorage);
        this._breakpointManager._targetManager.unobserveModels(SDK.DebuggerModel.DebuggerModel, this);
        this.clearUISourceCodes();
    }
    /**
     * @return {string}
     */
    _breakpointStorageId() {
        return BreakpointManager._breakpointStorageId(this._url, this._lineNumber, this._columnNumber);
    }
    _resetLocations() {
        this.clearUISourceCodes();
        for (const modelBreakpoint of this._modelBreakpoints.values()) {
            modelBreakpoint._resetLocations();
        }
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @return {!Workspace.UISourceCode.UILocation}
     */
    _defaultUILocation(uiSourceCode) {
        return uiSourceCode.uiLocation(this._lineNumber, this._columnNumber);
    }
    _removeAllUnboundLocations() {
        for (const uiSourceCode of this._uiSourceCodes) {
            this._breakpointManager._uiLocationRemoved(this, this._defaultUILocation(uiSourceCode));
        }
    }
    _addAllUnboundLocations() {
        for (const uiSourceCode of this._uiSourceCodes) {
            this._breakpointManager._uiLocationAdded(this, this._defaultUILocation(uiSourceCode));
        }
    }
}
export class ModelBreakpoint {
    /**
     * @param {!SDK.DebuggerModel.DebuggerModel} debuggerModel
     * @param {!Breakpoint} breakpoint
     * @param {!DebuggerWorkspaceBinding} debuggerWorkspaceBinding
     */
    constructor(debuggerModel, breakpoint, debuggerWorkspaceBinding) {
        this._debuggerModel = debuggerModel;
        this._breakpoint = breakpoint;
        this._debuggerWorkspaceBinding = debuggerWorkspaceBinding;
        this._liveLocations = new LiveLocationPool();
        /** @type {!Map<!LiveLocation, !Workspace.UISourceCode.UILocation>} */
        this._uiLocations = new Map();
        this._debuggerModel.addEventListener(SDK.DebuggerModel.Events.DebuggerWasDisabled, this._cleanUpAfterDebuggerIsGone, this);
        this._debuggerModel.addEventListener(SDK.DebuggerModel.Events.DebuggerWasEnabled, this._scheduleUpdateInDebugger, this);
        this._hasPendingUpdate = false;
        this._isUpdating = false;
        this._cancelCallback = false;
        this._currentState = null;
        /** @type {string[]} */
        this._breakpointIds = [];
        if (this._debuggerModel.debuggerEnabled()) {
            this._scheduleUpdateInDebugger();
        }
    }
    _resetLocations() {
        for (const uiLocation of this._uiLocations.values()) {
            this._breakpoint._uiLocationRemoved(uiLocation);
        }
        this._uiLocations.clear();
        this._liveLocations.disposeAll();
    }
    _scheduleUpdateInDebugger() {
        if (this._isUpdating) {
            this._hasPendingUpdate = true;
            return;
        }
        this._isUpdating = true;
        this._updateInDebugger(this._didUpdateInDebugger.bind(this));
    }
    _didUpdateInDebugger() {
        this._isUpdating = false;
        if (this._hasPendingUpdate) {
            this._hasPendingUpdate = false;
            this._scheduleUpdateInDebugger();
        }
    }
    /**
     * @return {boolean}
     */
    _scriptDiverged() {
        for (const uiSourceCode of this._breakpoint._uiSourceCodes) {
            const scriptFile = this._debuggerWorkspaceBinding.scriptFile(uiSourceCode, this._debuggerModel);
            if (scriptFile && scriptFile.hasDivergedFromVM()) {
                return true;
            }
        }
        return false;
    }
    /**
     * @param {function():void} callback
     * @return {!Promise<void>}
     */
    async _updateInDebugger(callback) {
        if (this._debuggerModel.target().isDisposed()) {
            this._cleanUpAfterDebuggerIsGone();
            callback();
            return;
        }
        const lineNumber = this._breakpoint._lineNumber;
        const columnNumber = this._breakpoint._columnNumber;
        const condition = this._breakpoint.condition();
        /** @type {SDK.DebuggerModel.Location[]} */
        let debuggerLocations = [];
        for (const uiSourceCode of this._breakpoint._uiSourceCodes) {
            const { pluginManager } = DebuggerWorkspaceBinding.instance();
            if (pluginManager) {
                // We have a separate code path for plugins as the requirements for setting a breakpoint
                // on every inlined/unrolled location aren't the same as the requirements for translating
                // ui locations to raw locations in general.
                const locationRanges = await pluginManager.uiLocationToRawLocationRanges(uiSourceCode, lineNumber, columnNumber);
                if (locationRanges && locationRanges.length) {
                    const script = locationRanges[0].start.script();
                    debuggerLocations = locationRanges.map(({ start }) => start).filter(dl => dl.script() === script);
                    break;
                }
            }
            // Fall back to general case.
            const locations = await DebuggerWorkspaceBinding.instance().uiLocationToRawLocations(uiSourceCode, lineNumber, columnNumber);
            debuggerLocations = locations.filter(location => location.debuggerModel === this._debuggerModel);
            if (debuggerLocations.length > 0) {
                // Only want first location
                debuggerLocations = [debuggerLocations[0]];
                break;
            }
        }
        /** @type {Breakpoint.State | null} */
        let newState = null;
        if (this._breakpoint._isRemoved || !this._breakpoint.enabled() || this._scriptDiverged()) {
            newState = null;
        }
        else if (debuggerLocations.length > 0 && debuggerLocations[0].script()) {
            const script = debuggerLocations[0].script();
            if (!script) {
                return;
            }
            const sourcePositions = debuggerLocations.map(loc => ({ lineNumber: loc.lineNumber, columnNumber: loc.columnNumber }));
            if (script.sourceURL) {
                newState = new Breakpoint.State(script.sourceURL, null, null, sourcePositions, condition);
            }
            else {
                newState = new Breakpoint.State(null, script.scriptId, script.hash, sourcePositions, condition);
            }
        }
        else if (this._breakpoint._currentState && this._breakpoint._currentState.url) {
            const position = this._breakpoint._currentState;
            newState = new Breakpoint.State(position.url, null, null, position.positions, condition);
        }
        else if (this._breakpoint._uiSourceCodes.size > 0) { // Uncertain if this condition is necessary
            newState = new Breakpoint.State(this._breakpoint.url(), null, null, [{ lineNumber, columnNumber }], condition);
        }
        if (this._breakpointIds.length && Breakpoint.State.equals(newState, this._currentState)) {
            callback();
            return;
        }
        this._breakpoint._currentState = newState;
        if (this._breakpointIds.length) {
            await this._refreshBreakpoint();
            callback();
            return;
        }
        if (!newState) {
            callback();
            return;
        }
        this._currentState = newState;
        // Assigning to constant so TypeScript can be sure this isn't null.
        const { url, scriptId, scriptHash } = newState;
        let resultPromises;
        if (url) {
            resultPromises = newState.positions.map(({ lineNumber, columnNumber }) => this._debuggerModel.setBreakpointByURL(url, lineNumber, columnNumber, condition));
        }
        else if (scriptId && scriptHash) {
            resultPromises = newState.positions.map(({ lineNumber, columnNumber }) => this._debuggerModel.setBreakpointInAnonymousScript(scriptId, scriptHash, lineNumber, columnNumber, condition));
        }
        if (resultPromises) {
            const results = await Promise.all(resultPromises);
            /** @type {string[]} */
            const breakpointIds = [];
            /** @type {SDK.DebuggerModel.Location[]} */
            let combinedLocations = [];
            for (const { breakpointId, locations } of results) {
                if (breakpointId) {
                    breakpointIds.push(breakpointId);
                    combinedLocations = combinedLocations.concat(locations);
                }
            }
            await this._didSetBreakpointInDebugger(callback, breakpointIds, combinedLocations);
        }
    }
    async _refreshBreakpoint() {
        if (!this._breakpointIds.length) {
            return;
        }
        this._resetLocations();
        await Promise.all(this._breakpointIds.map(id => this._debuggerModel.removeBreakpoint(id)));
        this._didRemoveFromDebugger();
        this._currentState = null;
        this._scheduleUpdateInDebugger();
    }
    /**
     * @param {function():void} callback
     * @param {Protocol.Debugger.BreakpointId[]} breakpointIds
     * @param {!Array.<!SDK.DebuggerModel.Location>} locations
     */
    async _didSetBreakpointInDebugger(callback, breakpointIds, locations) {
        if (this._cancelCallback) {
            this._cancelCallback = false;
            callback();
            return;
        }
        if (!breakpointIds.length) {
            this._breakpoint.remove(true);
            callback();
            return;
        }
        this._breakpointIds = breakpointIds;
        for (const debuggerId of this._breakpointIds) {
            this._debuggerModel.addBreakpointListener(debuggerId, /**
              * @param {!Common.EventTarget.EventTargetEvent} event
              */ /**
              * @param {!Common.EventTarget.EventTargetEvent} event
              */ event => this._breakpointResolved(event), this);
        }
        for (const location of locations) {
            if (!(await this._addResolvedLocation(location))) {
                break;
            }
        }
        callback();
    }
    _didRemoveFromDebugger() {
        if (this._cancelCallback) {
            this._cancelCallback = false;
            return;
        }
        this._resetLocations();
        for (const debuggerId of this._breakpointIds) {
            this._debuggerModel.removeBreakpointListener(debuggerId, /**
          * @param {!Common.EventTarget.EventTargetEvent} event
          */ /**
          * @param {!Common.EventTarget.EventTargetEvent} event
          */ event => this._breakpointResolved(event), this);
        }
        this._breakpointIds = [];
    }
    /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
    async _breakpointResolved(event) {
        await this._addResolvedLocation(/** @type {!SDK.DebuggerModel.Location}*/ (event.data));
    }
    /**
     * @param {!LiveLocation} liveLocation
     */
    async _locationUpdated(liveLocation) {
        const oldUILocation = this._uiLocations.get(liveLocation);
        const uiLocation = await liveLocation.uiLocation();
        if (oldUILocation) {
            this._breakpoint._uiLocationRemoved(oldUILocation);
        }
        if (uiLocation) {
            this._uiLocations.set(liveLocation, uiLocation);
            this._breakpoint._uiLocationAdded(uiLocation);
        }
        else {
            this._uiLocations.delete(liveLocation);
        }
    }
    /**
     * @param {!SDK.DebuggerModel.Location} location
     * @return {!Promise<boolean>}
     */
    async _addResolvedLocation(location) {
        const uiLocation = await this._debuggerWorkspaceBinding.rawLocationToUILocation(location);
        if (!uiLocation) {
            return false;
        }
        const breakpointLocation = this._breakpoint._breakpointManager.findBreakpoint(uiLocation);
        if (breakpointLocation && breakpointLocation.breakpoint !== this._breakpoint) {
            // location clash
            this._breakpoint.remove(false /* keepInStorage */);
            return false;
        }
        await this._debuggerWorkspaceBinding.createLiveLocation(location, this._locationUpdated.bind(this), this._liveLocations);
        return true;
    }
    _cleanUpAfterDebuggerIsGone() {
        if (this._isUpdating) {
            this._cancelCallback = true;
        }
        this._resetLocations();
        this._currentState = null;
        if (this._breakpointIds.length) {
            this._didRemoveFromDebugger();
        }
    }
    _removeEventListeners() {
        this._debuggerModel.removeEventListener(SDK.DebuggerModel.Events.DebuggerWasDisabled, this._cleanUpAfterDebuggerIsGone, this);
        this._debuggerModel.removeEventListener(SDK.DebuggerModel.Events.DebuggerWasEnabled, this._scheduleUpdateInDebugger, this);
    }
}
Breakpoint.State = class {
    /**
     * @param {?string} url
     * @param {?string} scriptId
     * @param {?string} scriptHash
     * @param {Array.<{lineNumber: number, columnNumber?: number}>} positions
     * @param {string} condition
     */
    constructor(url, scriptId, scriptHash, positions, condition) {
        this.url = url;
        this.scriptId = scriptId;
        this.scriptHash = scriptHash;
        this.positions = positions;
        this.condition = condition;
    }
    /**
     * @param {?Breakpoint.State|undefined} stateA
     * @param {?Breakpoint.State|undefined} stateB
     * @return {boolean}
     */
    static equals(stateA, stateB) {
        if (!stateA || !stateB) {
            return false;
        }
        if (stateA.url === stateB.url && stateA.scriptId === stateB.scriptId && stateA.scriptHash === stateB.scriptHash &&
            stateA.positions.length === stateB.positions.length && stateA.condition === stateB.condition) {
            for (let i = 0; i < stateA.positions.length; i++) {
                if (stateA.positions[i].lineNumber !== stateB.positions[i].lineNumber ||
                    stateA.positions[i].columnNumber !== stateB.positions[i].columnNumber) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
};
class Storage {
    constructor() {
        this._setting = Common.Settings.Settings.instance().createLocalSetting('breakpoints', []);
        /** @type {!Map<string, !Storage.Item>} */
        this._breakpoints = new Map();
        const items = /** @type {!Array<!Storage.Item>} */ (this._setting.get());
        for (const item of items) {
            this._breakpoints.set(BreakpointManager._breakpointStorageId(item.url, item.lineNumber, item.columnNumber), item);
        }
        /** @type {boolean|undefined} */ this._muted;
    }
    mute() {
        this._muted = true;
    }
    unmute() {
        delete this._muted;
    }
    /**
     * @param {string} url
     * @return {!Array<!Storage.Item>}
     */
    breakpointItems(url) {
        return Array.from(this._breakpoints.values()).filter(item => item.url === url);
    }
    /**
     * @param {!Breakpoint} breakpoint
     */
    _updateBreakpoint(breakpoint) {
        if (this._muted || !breakpoint._breakpointStorageId()) {
            return;
        }
        this._breakpoints.set(breakpoint._breakpointStorageId(), new Storage.Item(breakpoint));
        this._save();
    }
    /**
     * @param {!Breakpoint} breakpoint
     */
    _removeBreakpoint(breakpoint) {
        if (!this._muted) {
            this._breakpoints.delete(breakpoint._breakpointStorageId());
            this._save();
        }
    }
    _save() {
        this._setting.set(Array.from(this._breakpoints.values()));
    }
}
Storage.Item = class {
    /**
     * @param {!Breakpoint} breakpoint
     */
    constructor(breakpoint) {
        this.url = breakpoint._url;
        this.lineNumber = breakpoint.lineNumber();
        this.columnNumber = breakpoint.columnNumber();
        this.condition = breakpoint.condition();
        this.enabled = breakpoint.enabled();
    }
};
/** @typedef {{
 *    breakpoint: !Breakpoint,
 *    uiLocation: !Workspace.UISourceCode.UILocation
 *  }}
 */
// @ts-ignore typedef
export let BreakpointLocation;
//# sourceMappingURL=BreakpointManager.js.map