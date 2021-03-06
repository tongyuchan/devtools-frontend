// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../i18n/i18n.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
export const UIStrings = {
    /**
    *@description Title of WebAuthn tab in bottom drawer.
    */
    webauthn: 'WebAuthn',
};
const str_ = i18n.i18n.registerUIStrings('webauthn/webauthn-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
let loadedWebauthnModule;
async function loadWebauthnModule() {
    if (!loadedWebauthnModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('webauthn');
        loadedWebauthnModule = await import('./webauthn.js');
    }
    return loadedWebauthnModule;
}
UI.ViewManager.registerViewExtension({
    location: "drawer-view" /* DRAWER_VIEW */,
    id: 'webauthn-pane',
    title: i18nString(UIStrings.webauthn),
    commandPrompt: 'Show WebAuthn',
    order: 100,
    persistence: "closeable" /* CLOSEABLE */,
    async loadView() {
        const Webauthn = await loadWebauthnModule();
        return Webauthn.WebauthnPane.WebauthnPaneImpl.instance();
    },
    experiment: Root.Runtime.ExperimentName.WEBAUTHN_PANE,
});
//# sourceMappingURL=webauthn-meta.js.map