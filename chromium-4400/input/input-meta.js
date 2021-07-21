// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { ls } from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
let loadedInputModule;
async function loadInputModule() {
    if (!loadedInputModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('input');
        loadedInputModule = await import('./input.js');
    }
    return loadedInputModule;
}
UI.ViewManager.registerViewExtension({
    location: "drawer-view" /* DRAWER_VIEW */,
    id: 'Inputs',
    title: () => ls `Inputs`,
    commandPrompt: 'Show Inputs',
    persistence: "closeable" /* CLOSEABLE */,
    order: 7,
    async loadView() {
        const Input = await loadInputModule();
        return Input.InputTimeline.InputTimeline.instance();
    },
    experiment: Root.Runtime.ExperimentName.TIMELINE_REPLAY_EVENT,
});
//# sourceMappingURL=input-meta.js.map