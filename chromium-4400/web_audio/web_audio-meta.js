// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../i18n/i18n.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
export const UIStrings = {
    /**
    *@description Title of the WebAudio tool
    */
    webaudio: 'WebAudio',
    /**
   *@description A tags of WebAudio tool that can be searched in the command menu
   */
    audio: 'audio',
};
const str_ = i18n.i18n.registerUIStrings('web_audio/web_audio-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
let loadedWebAudioModule;
async function loadWebAudioModule() {
    if (!loadedWebAudioModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('web_audio');
        loadedWebAudioModule = await import('./web_audio.js');
    }
    return loadedWebAudioModule;
}
UI.ViewManager.registerViewExtension({
    location: "drawer-view" /* DRAWER_VIEW */,
    id: 'web-audio',
    title: i18nString(UIStrings.webaudio),
    commandPrompt: 'Show WebAudio',
    persistence: "closeable" /* CLOSEABLE */,
    order: 100,
    async loadView() {
        const WebAudio = await loadWebAudioModule();
        return WebAudio.WebAudioView.WebAudioView.instance();
    },
    tags: [i18nString(UIStrings.audio)],
});
//# sourceMappingURL=web_audio-meta.js.map