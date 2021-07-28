// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { ls } from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
let loadedCoverageModule;
async function loadCoverageModule() {
    if (!loadedCoverageModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('coverage');
        loadedCoverageModule = await import('./coverage.js');
    }
    return loadedCoverageModule;
}
UI.ViewManager.registerViewExtension({
    location: "drawer-view" /* DRAWER_VIEW */,
    id: 'coverage',
    title: () => ls `Coverage`,
    commandPrompt: 'Show Coverage',
    persistence: "closeable" /* CLOSEABLE */,
    order: 100,
    async loadView() {
        const Coverage = await loadCoverageModule();
        return Coverage.CoverageView.CoverageView.instance();
    },
});
