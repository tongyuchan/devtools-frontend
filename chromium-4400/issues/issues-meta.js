// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { ls } from '../platform/platform.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
let loadedIssuesModule;
async function loadIssuesModule() {
    if (!loadedIssuesModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('issues');
        loadedIssuesModule = await import('./issues.js');
    }
    return loadedIssuesModule;
}
UI.ViewManager.registerViewExtension({
    location: "drawer-view" /* DRAWER_VIEW */,
    id: 'issues-pane',
    title: () => ls `Issues`,
    commandPrompt: 'Show Issues',
    order: 100,
    persistence: "closeable" /* CLOSEABLE */,
    async loadView() {
        const Issues = await loadIssuesModule();
        return Issues.IssuesPane.IssuesPaneImpl.instance();
    },
});
UI.ViewManager.registerViewExtension({
    location: "drawer-view" /* DRAWER_VIEW */,
    id: 'csp-violations-pane',
    title: () => ls `CSP Violations`,
    commandPrompt: 'Show CSP Violations',
    order: 100,
    persistence: "closeable" /* CLOSEABLE */,
    async loadView() {
        const Issues = await loadIssuesModule();
        return Issues.CSPViolationsView.CSPViolationsView.instance();
    },
    experiment: Root.Runtime.ExperimentName.CSP_VIOLATIONS_VIEW,
});
//# sourceMappingURL=issues-meta.js.map