// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../i18n/i18n.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
export const UIStrings = {
    /**
    *@description Text for keyboard shortcuts
    */
    shortcuts: 'Shortcuts',
    /**
   *@description Text in Settings Screen of the Settings
   */
    preferences: 'Preferences',
    /**
   *@description Text in Settings Screen of the Settings
   */
    experiments: 'Experiments',
    /**
   *@description Title of Ignore List settings
   */
    ignoreList: 'Ignore List',
};
const str_ = i18n.i18n.registerUIStrings('settings/settings-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
let loadedSettingsModule;
async function loadSettingsModule() {
    if (!loadedSettingsModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('settings');
        loadedSettingsModule = await import('./settings.js');
    }
    return loadedSettingsModule;
}
UI.ViewManager.registerViewExtension({
    location: "settings-view" /* SETTINGS_VIEW */,
    id: 'preferences',
    title: i18nString(UIStrings.preferences),
    commandPrompt: 'Show Preferences',
    order: 0,
    async loadView() {
        const Settings = await loadSettingsModule();
        return Settings.SettingsScreen.GenericSettingsTab.instance();
    },
});
UI.ViewManager.registerViewExtension({
    location: "settings-view" /* SETTINGS_VIEW */,
    id: 'experiments',
    title: i18nString(UIStrings.experiments),
    commandPrompt: 'Show Experiments',
    order: 3,
    experiment: Root.Runtime.ExperimentName.ALL,
    async loadView() {
        const Settings = await loadSettingsModule();
        return Settings.SettingsScreen.ExperimentsSettingsTab.instance();
    },
});
UI.ViewManager.registerViewExtension({
    location: "settings-view" /* SETTINGS_VIEW */,
    id: 'blackbox',
    title: i18nString(UIStrings.ignoreList),
    commandPrompt: 'Show Ignore List',
    order: 4,
    async loadView() {
        const Settings = await loadSettingsModule();
        return Settings.FrameworkIgnoreListSettingsTab.FrameworkIgnoreListSettingsTab.instance();
    },
});
UI.ViewManager.registerViewExtension({
    location: "settings-view" /* SETTINGS_VIEW */,
    id: 'keybinds',
    title: i18nString(UIStrings.shortcuts),
    commandPrompt: 'Show Shortcuts',
    order: 100,
    async loadView() {
        const Settings = await loadSettingsModule();
        return Settings.KeybindsSettingsTab.KeybindsSettingsTab.instance();
    },
});
//# sourceMappingURL=settings-meta.js.map