// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../i18n/i18n.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
export const UIStrings = {
    /**
    *@description Text for throttling the network
    */
    throttling: 'Throttling',
};
const str_ = i18n.i18n.registerUIStrings('mobile_throttling/mobile_throttling-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
let loadedMobileThrottlingModule;
async function loadMobileThrottlingModule() {
    if (!loadedMobileThrottlingModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('mobile_throttling');
        loadedMobileThrottlingModule = await import('./mobile_throttling.js');
    }
    return loadedMobileThrottlingModule;
}
UI.ViewManager.registerViewExtension({
    location: "settings-view" /* SETTINGS_VIEW */,
    id: 'throttling-conditions',
    title: i18nString(UIStrings.throttling),
    commandPrompt: 'Show Throttling',
    order: 35,
    async loadView() {
        const MobileThrottling = await loadMobileThrottlingModule();
        return MobileThrottling.ThrottlingSettingsTab.ThrottlingSettingsTab.instance();
    },
    settings: [
        'customNetworkConditions',
    ],
});
//# sourceMappingURL=mobile_throttling-meta.js.map