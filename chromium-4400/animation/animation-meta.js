// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { ls } from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
let loadedAnimationModule;
async function loadAnimationModule() {
    if (!loadedAnimationModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('animation');
        loadedAnimationModule = await import('./animation.js');
    }
    return loadedAnimationModule;
}
UI.ViewManager.registerViewExtension({
    location: "drawer-view" /* DRAWER_VIEW */,
    id: 'animations',
    title: () => ls `Animations`,
    commandPrompt: 'Show Animations',
    persistence: "closeable" /* CLOSEABLE */,
    order: 0,
    async loadView() {
        const Animation = await loadAnimationModule();
        return Animation.AnimationTimeline.AnimationTimeline.instance();
    },
});
