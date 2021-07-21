// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../i18n/i18n.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
export const UIStrings = {
    /**
    *@description Title of the Profiler tool
    */
    profiler: 'Profiler',
};
const str_ = i18n.i18n.registerUIStrings('js_profiler/js_profiler-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
let loadedProfilerModule;
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
    id: 'js_profiler',
    title: () => i18nString(UIStrings.profiler),
    commandPrompt: 'Show Profiler',
    order: 65,
    async loadView() {
        const Profiler = await loadProfilerModule();
        return Profiler.ProfilesPanel.JSProfilerPanel.instance();
    },
});
//# sourceMappingURL=js_profiler-meta.js.map