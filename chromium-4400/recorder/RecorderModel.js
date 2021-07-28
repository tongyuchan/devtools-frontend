// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/* eslint-disable rulesdir/no_underscored_properties */
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';
import { RecordingSession } from './RecordingSession.js';
export class RecorderModel extends SDK.SDKModel.SDKModel {
    constructor(target) {
        super(target);
        this._debuggerAgent = target.debuggerAgent();
        this._domDebuggerAgent = target.domdebuggerAgent();
        this._runtimeAgent = target.runtimeAgent();
        this._accessibilityAgent = target.accessibilityAgent();
        this._toggleRecordAction =
            UI.ActionRegistry.ActionRegistry.instance().action('recorder.toggle-recording');
        this._state = "Idle" /* Idle */;
        this._currentRecordingSession = null;
    }
    async updateState(newState) {
        this._state = newState;
        this._toggleRecordAction.setToggled(this._state === "Recording" /* Recording */);
    }
    isRecording() {
        return this._state === "Recording" /* Recording */;
    }
    async toggleRecording(uiSourceCode) {
        if (this._state === "Idle" /* Idle */) {
            await this.startRecording(uiSourceCode);
            await this.updateState("Recording" /* Recording */);
        }
        else if (this._state === "Recording" /* Recording */) {
            await this.stopRecording();
            await this.updateState("Idle" /* Idle */);
        }
    }
    async startRecording(uiSourceCode) {
        this._currentRecordingSession = new RecordingSession(this.target(), uiSourceCode);
        await this._currentRecordingSession.start();
    }
    async stopRecording() {
        if (!this._currentRecordingSession) {
            return;
        }
        this._currentRecordingSession.stop();
        this._currentRecordingSession = null;
    }
}
SDK.SDKModel.SDKModel.register(RecorderModel, SDK.SDKModel.Capability.None, false);
