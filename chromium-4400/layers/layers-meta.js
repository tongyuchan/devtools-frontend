// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../i18n/i18n.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
export const UIStrings = {
    /**
    *@description Title of the Layers tool
    */
    layers: 'Layers',
};
const str_ = i18n.i18n.registerUIStrings('layers/layers-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
let loadedLayersModule;
async function loadLayersModule() {
    if (!loadedLayersModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('layers');
        loadedLayersModule = await import('./layers.js');
    }
    return loadedLayersModule;
}
UI.ViewManager.registerViewExtension({
    location: "panel" /* PANEL */,
    id: 'layers',
    title: () => i18nString(UIStrings.layers),
    commandPrompt: 'Show Layers',
    order: 100,
    persistence: "closeable" /* CLOSEABLE */,
    async loadView() {
        const Layers = await loadLayersModule();
        return Layers.LayersPanel.LayersPanel.instance();
    },
});
//# sourceMappingURL=layers-meta.js.map