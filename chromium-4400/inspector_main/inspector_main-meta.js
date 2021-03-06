// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { ls } from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
let loadedInspectorMainModule;
async function loadInspectorMainModule() {
    if (!loadedInspectorMainModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('inspector_main');
        loadedInspectorMainModule = await import('./inspector_main.js');
    }
    return loadedInspectorMainModule;
}
UI.ViewManager.registerViewExtension({
    location: "drawer-view" /* DRAWER_VIEW */,
    id: 'rendering',
    title: () => ls `Rendering`,
    commandPrompt: 'Show Rendering',
    persistence: "closeable" /* CLOSEABLE */,
    order: 50,
    async loadView() {
        const InspectorMain = await loadInspectorMainModule();
        return InspectorMain.RenderingOptions.RenderingOptionsView.instance();
    },
    tags: [
        () => ls `paint`,
        () => ls `layout`,
        () => ls `fps`,
        () => ls `CSS media type`,
        () => ls `CSS media feature`,
        () => ls `vision deficiency`,
        () => ls `color vision deficiency`,
    ],
});
//# sourceMappingURL=inspector_main-meta.js.map