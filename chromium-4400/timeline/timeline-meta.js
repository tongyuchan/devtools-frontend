// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { ls } from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
let loadedTimelineModule;
let loadedProfilerModule;
async function loadTimelineModule() {
    if (!loadedTimelineModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('timeline');
        loadedTimelineModule = await import('./timeline.js');
    }
    return loadedTimelineModule;
}
// The profiler module is imported here because the view with id `js_profiler`
// is implemented by `JSProfilerPanel` in profiler. It cannot be registered
// in the profiler module as it belongs to the shell app and thus all apps
// that extend from shell will have such view registered. This would cause a
// collision with js_app as a separate view with the same id is registered in it.
async function loadProfilerModule() {
    if (!loadedProfilerModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('profiler');
        loadedProfilerModule = await import('../profiler/profiler.js');
    }
    return loadedProfilerModule;
}
UI.ViewManager.registerViewExtension({
    location: "panel" /* PANEL */,
    id: 'timeline',
    title: () => ls `Performance`,
    commandPrompt: 'Show Performance',
    order: 50,
    async loadView() {
        const Timeline = await loadTimelineModule();
        return Timeline.TimelinePanel.TimelinePanel.instance();
    },
});
UI.ViewManager.registerViewExtension({
    location: "panel" /* PANEL */,
    id: 'js_profiler',
    title: () => ls `JavaScript Profiler`,
    commandPrompt: 'Show JavaScript Profiler',
    persistence: "closeable" /* CLOSEABLE */,
    order: 65,
    async loadView() {
        const Profiler = await loadProfilerModule();
        return Profiler.ProfilesPanel.JSProfilerPanel.instance();
    },
});
//# sourceMappingURL=timeline-meta.js.map