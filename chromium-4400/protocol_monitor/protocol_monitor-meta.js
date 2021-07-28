// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../i18n/i18n.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
export const UIStrings = {
    /**
    *@description Title of the 'Protocol monitor' tool in the bottom drawer
    */
    protocolMonitor: 'Protocol monitor',
};
const str_ = i18n.i18n.registerUIStrings('protocol_monitor/protocol_monitor-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
let loadedProtocolMonitorModule;
async function loadProtocolMonitorModule() {
    if (!loadedProtocolMonitorModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('protocol_monitor');
        loadedProtocolMonitorModule = await import('./protocol_monitor.js');
    }
    return loadedProtocolMonitorModule;
}
UI.ViewManager.registerViewExtension({
    location: "drawer-view" /* DRAWER_VIEW */,
    id: 'protocol-monitor',
    title: i18nString(UIStrings.protocolMonitor),
    commandPrompt: 'Show Protocol monitor',
    order: 100,
    persistence: "closeable" /* CLOSEABLE */,
    async loadView() {
        const ProtocolMonitor = await loadProtocolMonitorModule();
        return ProtocolMonitor.ProtocolMonitor.ProtocolMonitorImpl.instance();
    },
    experiment: Root.Runtime.ExperimentName.PROTOCOL_MONITOR,
});
