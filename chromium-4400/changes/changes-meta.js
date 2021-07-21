// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { ls } from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
let loadedChangesModule;
async function loadChangesModule() {
    if (!loadedChangesModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('changes');
        loadedChangesModule = await import('./changes.js');
    }
    return loadedChangesModule;
}
UI.ViewManager.registerViewExtension({
    location: "drawer-view" /* DRAWER_VIEW */,
    id: 'changes.changes',
    title: () => ls `Changes`,
    commandPrompt: 'Show Changes',
    persistence: "closeable" /* CLOSEABLE */,
    async loadView() {
        const Changes = await loadChangesModule();
        return Changes.ChangesView.ChangesView.instance();
    },
});
//# sourceMappingURL=changes-meta.js.map