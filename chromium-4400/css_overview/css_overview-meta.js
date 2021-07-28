// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../i18n/i18n.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
export const UIStrings = {
    /**
    *@description Title of the CSS Overview Panel
    */
    cssOverview: 'CSS Overview',
};
const str_ = i18n.i18n.registerUIStrings('css_overview/css_overview-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
let loadedCSSOverviewModule;
async function loadCSSOverviewModule() {
    if (!loadedCSSOverviewModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('css_overview');
        loadedCSSOverviewModule = await import('./css_overview.js');
    }
    return loadedCSSOverviewModule;
}
UI.ViewManager.registerViewExtension({
    location: "panel" /* PANEL */,
    id: 'cssoverview',
    commandPrompt: 'Show CSS Overview',
    title: i18nString(UIStrings.cssOverview),
    order: 95,
    async loadView() {
        const CSSOverview = await loadCSSOverviewModule();
        return CSSOverview.CSSOverviewPanel.CSSOverviewPanel.instance();
    },
    experiment: Root.Runtime.ExperimentName.CSS_OVERVIEW,
});
