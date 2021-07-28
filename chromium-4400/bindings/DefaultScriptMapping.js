/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
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
import { ContentProviderBasedProject } from './ContentProviderBasedProject.js';
/** @type {!WeakMap<!Workspace.UISourceCode.UISourceCode, !Set<!SDK.Script.Script>>} */
const uiSourceCodeToScriptsMap = new WeakMap();
/** @type {!WeakMap<!SDK.Script.Script, !Workspace.UISourceCode.UISourceCode>} */
const scriptToUISourceCodeMap = new WeakMap();
/**
 * @implements {DebuggerSourceMapping}
 */
export class DefaultScriptMapping {
    /**
     * @param {!SDK.DebuggerModel.DebuggerModel} debuggerModel
     * @param {!Workspace.Workspace.WorkspaceImpl} workspace
     * @param {!DebuggerWorkspaceBinding} debuggerWorkspaceBinding
     */
    constructor(debuggerModel, workspace, debuggerWorkspaceBinding) {
        this._debuggerModel = debuggerModel;
        this._debuggerWorkspaceBinding = debuggerWorkspaceBinding;
        this._project = new ContentProviderBasedProject(workspace, 'debugger:' + debuggerModel.target().id(), Workspace.Workspace.projectTypes.Debugger, '', true /* isServiceProject */);
        this._eventListeners = [
            debuggerModel.addEventListener(SDK.DebuggerModel.Events.GlobalObjectCleared, this._debuggerReset, this),
            debuggerModel.addEventListener(SDK.DebuggerModel.Events.ParsedScriptSource, this._parsedScriptSource, this),
            debuggerModel.addEventListener(SDK.DebuggerModel.Events.DiscardedAnonymousScriptSource, this._discardedScriptSource, this)
        ];
        /** @type {!WeakMap<!Workspace.UISourceCode.UISourceCode, !SDK.Script.Script>} */
        this._uiSourceCodeToScriptsMap = new WeakMap();
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @return {?SDK.Script.Script}
     */
    static scriptForUISourceCode(uiSourceCode) {
        const scripts = uiSourceCodeToScriptsMap.get(uiSourceCode);
        return scripts ? scripts.values().next().value : null;
    }
    /**
     * @override
     * @param {!SDK.DebuggerModel.Location} rawLocation
     * @return {?Workspace.UISourceCode.UILocation}
     */
    rawLocationToUILocation(rawLocation) {
        const script = rawLocation.script();
        if (!script) {
            return null;
        }
        const uiSourceCode = scriptToUISourceCodeMap.get(script);
        if (!uiSourceCode) {
            return null;
        }
        const lineNumber = rawLocation.lineNumber - (script.isInlineScriptWithSourceURL() ? script.lineOffset : 0);
        let columnNumber = rawLocation.columnNumber || 0;
        if (script.isInlineScriptWithSourceURL() && !lineNumber && columnNumber) {
            columnNumber -= script.columnOffset;
        }
        return uiSourceCode.uiLocation(lineNumber, columnNumber);
    }
    /**
     * @override
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @param {number} lineNumber
     * @param {number} columnNumber
     * @return {!Array<!SDK.DebuggerModel.Location>}
     */
    uiLocationToRawLocations(uiSourceCode, lineNumber, columnNumber) {
        const script = this._uiSourceCodeToScriptsMap.get(uiSourceCode);
        if (!script) {
            return [];
        }
        if (script.isInlineScriptWithSourceURL()) {
            return [this._debuggerModel.createRawLocation(script, lineNumber + script.lineOffset, lineNumber ? columnNumber : columnNumber + script.columnOffset)];
        }
        return [this._debuggerModel.createRawLocation(script, lineNumber, columnNumber)];
    }
    /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
    _parsedScriptSource(event) {
        const script = /** @type {!SDK.Script.Script} */ (event.data);
        const name = Common.ParsedURL.ParsedURL.extractName(script.sourceURL);
        const url = 'debugger:///VM' + script.scriptId + (name ? ' ' + name : '');
        const uiSourceCode = this._project.createUISourceCode(url, Common.ResourceType.resourceTypes.Script);
        this._uiSourceCodeToScriptsMap.set(uiSourceCode, script);
        const scriptSet = uiSourceCodeToScriptsMap.get(uiSourceCode);
        if (!scriptSet) {
            uiSourceCodeToScriptsMap.set(uiSourceCode, new Set([script]));
        }
        else {
            scriptSet.add(script);
        }
        scriptToUISourceCodeMap.set(script, uiSourceCode);
        this._project.addUISourceCodeWithProvider(uiSourceCode, script, null, 'text/javascript');
        this._debuggerWorkspaceBinding.updateLocations(script);
    }
    /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
    _discardedScriptSource(event) {
        const script = /** @type {!SDK.Script.Script} */ (event.data);
        const uiSourceCode = scriptToUISourceCodeMap.get(script);
        if (!uiSourceCode) {
            return;
        }
        scriptToUISourceCodeMap.delete(script);
        this._uiSourceCodeToScriptsMap.delete(uiSourceCode);
        const scripts = uiSourceCodeToScriptsMap.get(uiSourceCode);
        if (scripts) {
            scripts.delete(script);
            if (!scripts.size) {
                uiSourceCodeToScriptsMap.delete(uiSourceCode);
            }
        }
        this._project.removeUISourceCode(uiSourceCode.url());
    }
    _debuggerReset() {
        this._project.reset();
    }
    dispose() {
        Common.EventTarget.EventTarget.removeEventListeners(this._eventListeners);
        this._debuggerReset();
        this._project.dispose();
    }
}
