// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../i18n/i18n.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
export const UIStrings = {
    /**
    *@description Title of the 'What's New' tool in the bottom drawer
    */
    whatsNew: 'What\'s New',
};
const str_ = i18n.i18n.registerUIStrings('help/help-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
let loadedHelpModule;
async function loadHelpModule() {
    if (!loadedHelpModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('help');
        loadedHelpModule = await import('./help.js');
    }
    return loadedHelpModule;
}
UI.ViewManager.registerViewExtension({
    location: "drawer-view" /* DRAWER_VIEW */,
    id: 'release-note',
    title: i18nString(UIStrings.whatsNew),
    commandPrompt: 'Show What\'s New',
    persistence: "closeable" /* CLOSEABLE */,
    order: 1,
    async loadView() {
        const Help = await loadHelpModule();
        return Help.ReleaseNoteView.ReleaseNoteView.instance();
    },
});
//# sourceMappingURL=help-meta.js.map