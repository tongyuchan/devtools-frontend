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
import * as SDK from '../sdk/sdk.js';
import * as Workspace from '../workspace/workspace.js';
import { DebuggerWorkspaceBinding } from './DebuggerWorkspaceBinding.js';
import { LiveLocationPool } from './LiveLocation.js'; // eslint-disable-line no-unused-vars
/** @type {!WeakMap<!SDK.DebuggerModel.DebuggerModel, !PresentationConsoleMessageHelper>} */
const debuggerModelToMessageHelperMap = new WeakMap();
/**
 * @implements {SDK.SDKModel.SDKModelObserver<!SDK.DebuggerModel.DebuggerModel>}
 */
export class PresentationConsoleMessageManager {
    constructor() {
        SDK.SDKModel.TargetManager.instance().observeModels(SDK.DebuggerModel.DebuggerModel, this);
        SDK.ConsoleModel.ConsoleModel.instance().addEventListener(SDK.ConsoleModel.Events.ConsoleCleared, this._consoleCleared, this);
        SDK.ConsoleModel.ConsoleModel.instance().addEventListener(SDK.ConsoleModel.Events.MessageAdded, event => this._consoleMessageAdded(/** @type {!SDK.ConsoleModel.ConsoleMessage} */ (event.data)));
        SDK.ConsoleModel.ConsoleModel.instance().messages().forEach(this._consoleMessageAdded, this);
    }
    /**
     * @override
     * @param {!SDK.DebuggerModel.DebuggerModel} debuggerModel
     */
    modelAdded(debuggerModel) {
        debuggerModelToMessageHelperMap.set(debuggerModel, new PresentationConsoleMessageHelper(debuggerModel));
    }
    /**
     * @override
     * @param {!SDK.DebuggerModel.DebuggerModel} debuggerModel
     */
    modelRemoved(debuggerModel) {
        const helper = debuggerModelToMessageHelperMap.get(debuggerModel);
        if (helper) {
            helper._consoleCleared();
        }
    }
    /**
     * @param {!SDK.ConsoleModel.ConsoleMessage} message
     */
    _consoleMessageAdded(message) {
        const runtimeModel = message.runtimeModel();
        if (!message.isErrorOrWarning() || !message.runtimeModel() ||
            message.source === SDK.ConsoleModel.MessageSource.Violation || !runtimeModel) {
            return;
        }
        const helper = debuggerModelToMessageHelperMap.get(runtimeModel.debuggerModel());
        if (helper) {
            helper._consoleMessageAdded(message);
        }
    }
    _consoleCleared() {
        for (const debuggerModel of SDK.SDKModel.TargetManager.instance().models(SDK.DebuggerModel.DebuggerModel)) {
            const helper = debuggerModelToMessageHelperMap.get(debuggerModel);
            if (helper) {
                helper._consoleCleared();
            }
        }
    }
}
export class PresentationConsoleMessageHelper {
    /**
     * @param {!SDK.DebuggerModel.DebuggerModel} debuggerModel
     */
    constructor(debuggerModel) {
        this._debuggerModel = debuggerModel;
        /** @type {!Map<string, !Array.<!SDK.ConsoleModel.ConsoleMessage>>} */
        this._pendingConsoleMessages = new Map();
        /** @type {!Array.<!PresentationConsoleMessage>} */
        this._presentationConsoleMessages = [];
        // TODO(dgozman): queueMicrotask because we race with DebuggerWorkspaceBinding on ParsedScriptSource event delivery.
        debuggerModel.addEventListener(SDK.DebuggerModel.Events.ParsedScriptSource, event => {
            queueMicrotask(() => {
                this._parsedScriptSource(event);
            });
        });
        debuggerModel.addEventListener(SDK.DebuggerModel.Events.GlobalObjectCleared, this._debuggerReset, this);
        this._locationPool = new LiveLocationPool();
    }
    /**
     * @param {!SDK.ConsoleModel.ConsoleMessage} message
     */
    _consoleMessageAdded(message) {
        const rawLocation = this._rawLocation(message);
        if (rawLocation) {
            this._addConsoleMessageToScript(message, rawLocation);
        }
        else {
            this._addPendingConsoleMessage(message);
        }
    }
    /**
     * @param {!SDK.ConsoleModel.ConsoleMessage} message
     * @return {?SDK.DebuggerModel.Location}
     */
    _rawLocation(message) {
        if (message.scriptId) {
            return this._debuggerModel.createRawLocationByScriptId(message.scriptId, message.line, message.column);
        }
        const callFrame = message.stackTrace && message.stackTrace.callFrames ? message.stackTrace.callFrames[0] : null;
        if (callFrame) {
            return this._debuggerModel.createRawLocationByScriptId(callFrame.scriptId, callFrame.lineNumber, callFrame.columnNumber);
        }
        if (message.url) {
            return this._debuggerModel.createRawLocationByURL(message.url, message.line, message.column);
        }
        return null;
    }
    /**
     * @param {!SDK.ConsoleModel.ConsoleMessage} message
     * @param {!SDK.DebuggerModel.Location} rawLocation
     */
    _addConsoleMessageToScript(message, rawLocation) {
        this._presentationConsoleMessages.push(new PresentationConsoleMessage(message, rawLocation, this._locationPool));
    }
    /**
     * @param {!SDK.ConsoleModel.ConsoleMessage} message
     */
    _addPendingConsoleMessage(message) {
        if (!message.url) {
            return;
        }
        const pendingMessages = this._pendingConsoleMessages.get(message.url);
        if (!pendingMessages) {
            this._pendingConsoleMessages.set(message.url, [message]);
        }
        else {
            pendingMessages.push(message);
        }
    }
    /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
    _parsedScriptSource(event) {
        const script = /** @type {!SDK.Script.Script} */ (event.data);
        const messages = this._pendingConsoleMessages.get(script.sourceURL);
        if (!messages) {
            return;
        }
        const pendingMessages = [];
        for (const message of messages) {
            const rawLocation = this._rawLocation(message);
            if (rawLocation && script.scriptId === rawLocation.scriptId) {
                this._addConsoleMessageToScript(message, rawLocation);
            }
            else {
                pendingMessages.push(message);
            }
        }
        if (pendingMessages.length) {
            this._pendingConsoleMessages.set(script.sourceURL, pendingMessages);
        }
        else {
            this._pendingConsoleMessages.delete(script.sourceURL);
        }
    }
    _consoleCleared() {
        this._pendingConsoleMessages = new Map();
        this._debuggerReset();
    }
    _debuggerReset() {
        for (const message of this._presentationConsoleMessages) {
            message.dispose();
        }
        this._presentationConsoleMessages = [];
        this._locationPool.disposeAll();
    }
}
export class PresentationConsoleMessage {
    /**
     * @param {!SDK.ConsoleModel.ConsoleMessage} message
     * @param {!SDK.DebuggerModel.Location} rawLocation
     * @param {!LiveLocationPool} locationPool
     */
    constructor(message, rawLocation, locationPool) {
        this._text = message.messageText;
        this._level = message.level === SDK.ConsoleModel.MessageLevel.Error ? Workspace.UISourceCode.Message.Level.Error :
            Workspace.UISourceCode.Message.Level.Warning;
        DebuggerWorkspaceBinding.instance().createLiveLocation(rawLocation, this._updateLocation.bind(this), locationPool);
    }
    /**
     * @param {!LiveLocation} liveLocation
     */
    async _updateLocation(liveLocation) {
        if (this._uiMessage) {
            this._uiMessage.remove();
        }
        const uiLocation = await liveLocation.uiLocation();
        if (!uiLocation) {
            return;
        }
        this._uiMessage =
            uiLocation.uiSourceCode.addLineMessage(this._level, this._text, uiLocation.lineNumber, uiLocation.columnNumber);
    }
    dispose() {
        if (this._uiMessage) {
            this._uiMessage.remove();
        }
    }
}
//# sourceMappingURL=PresentationConsoleMessageHelper.js.map