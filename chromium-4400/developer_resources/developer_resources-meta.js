// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../i18n/i18n.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
export const UIStrings = {
    /**
     * @description Title for developer resources panel
     */
    developerResources: 'Developer Resources',
};
const str_ = i18n.i18n.registerUIStrings('developer_resources/developer_resources-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
let loadedDeveloperResourcesModule;
async function loadDeveloperResourcesModule() {
    if (!loadedDeveloperResourcesModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('developer_resources');
        loadedDeveloperResourcesModule = await import('./developer_resources.js');
    }
    return loadedDeveloperResourcesModule;
}
UI.ViewManager.registerViewExtension({
    location: "drawer-view" /* DRAWER_VIEW */,
    id: 'resource-loading-pane',
    title: () => i18nString(UIStrings.developerResources),
    commandPrompt: 'Show Developer Resources',
    order: 100,
    persistence: "closeable" /* CLOSEABLE */,
    experiment: Root.Runtime.ExperimentName.DEVELOPER_RESOURCES_VIEW,
    async loadView() {
        const DeveloperResources = await loadDeveloperResourcesModule();
        return DeveloperResources.DeveloperResourcesView.DeveloperResourcesView.instance();
    },
});
//# sourceMappingURL=developer_resources-meta.js.map