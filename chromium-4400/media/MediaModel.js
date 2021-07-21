// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/* eslint-disable rulesdir/no_underscored_properties */
import * as SDK from '../sdk/sdk.js';
export class MediaModel extends SDK.SDKModel.SDKModel {
    constructor(target) {
        super(target);
        this._enabled = false;
        this._agent = target.mediaAgent();
        target.registerMediaDispatcher(this);
    }
    async resumeModel() {
        if (!this._enabled) {
            return Promise.resolve();
        }
        await this._agent.invoke_enable();
    }
    ensureEnabled() {
        this._agent.invoke_enable();
        this._enabled = true;
    }
    playerPropertiesChanged(event) {
        this.dispatchEventToListeners("PlayerPropertiesChanged" /* PlayerPropertiesChanged */, event);
    }
    playerEventsAdded(event) {
        this.dispatchEventToListeners("PlayerEventsAdded" /* PlayerEventsAdded */, event);
    }
    playerMessagesLogged(event) {
        this.dispatchEventToListeners("PlayerMessagesLogged" /* PlayerMessagesLogged */, event);
    }
    playerErrorsRaised(event) {
        this.dispatchEventToListeners("PlayerErrorsRaised" /* PlayerErrorsRaised */, event);
    }
    playersCreated({ players }) {
        this.dispatchEventToListeners("PlayersCreated" /* PlayersCreated */, players);
    }
}
SDK.SDKModel.SDKModel.register(MediaModel, SDK.SDKModel.Capability.DOM, false);
//# sourceMappingURL=MediaModel.js.map