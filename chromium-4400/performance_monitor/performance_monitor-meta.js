// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../i18n/i18n.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
export const UIStrings = {
    /**
    *@description Title of the 'Performance monitor' tool in the bottom drawer
    */
    performanceMonitor: 'Performance monitor',
    /**
   *@description A tag of Performance Monitor that can be searched in the command menu
   */
    performance: 'performance',
    /**
   *@description A tag of Performance Monitor that can be searched in the command menu
   */
    systemMonitor: 'system monitor',
    /**
   *@description A tag of Performance Monitor that can be searched in the command menu
   */
    monitor: 'monitor',
    /**
   *@description A tag of Performance Monitor that can be searched in the command menu
   */
    activity: 'activity',
    /**
   *@description A tag of Performance Monitor that can be searched in the command menu
   */
    metrics: 'metrics',
};
const str_ = i18n.i18n.registerUIStrings('performance_monitor/performance_monitor-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
let loadedPerformanceMonitorModule;
async function loadPerformanceMonitorModule() {
    if (!loadedPerformanceMonitorModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('performance_monitor');
        loadedPerformanceMonitorModule = await import('./performance_monitor.js');
    }
    return loadedPerformanceMonitorModule;
}
UI.ViewManager.registerViewExtension({
    location: "drawer-view" /* DRAWER_VIEW */,
    id: 'performance.monitor',
    title: i18nString(UIStrings.performanceMonitor),
    commandPrompt: 'Show Performance monitor',
    persistence: "closeable" /* CLOSEABLE */,
    order: 100,
    async loadView() {
        const PerformanceMonitor = await loadPerformanceMonitorModule();
        return PerformanceMonitor.PerformanceMonitor.PerformanceMonitorImpl.instance();
    },
    tags: [
        i18nString(UIStrings.performance),
        i18nString(UIStrings.systemMonitor),
        i18nString(UIStrings.monitor),
        i18nString(UIStrings.activity),
        i18nString(UIStrings.metrics),
    ],
});
//# sourceMappingURL=performance_monitor-meta.js.map