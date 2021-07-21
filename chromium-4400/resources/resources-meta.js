// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { ls } from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
let loadedResourcesModule;
async function loadResourcesModule() {
    if (!loadedResourcesModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('resources');
        loadedResourcesModule = await import('./resources.js');
    }
    return loadedResourcesModule;
}
UI.ViewManager.registerViewExtension({
    location: "panel" /* PANEL */,
    id: 'resources',
    title: () => ls `Application`,
    commandPrompt: 'Show Application',
    order: 70,
    async loadView() {
        const Resources = await loadResourcesModule();
        return Resources.ResourcesPanel.ResourcesPanel.instance();
    },
    tags: [() => ls `pwa`],
});
//# sourceMappingURL=resources-meta.js.map