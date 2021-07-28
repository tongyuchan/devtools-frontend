// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../common/common.js';
import * as i18n from '../i18n/i18n.js';
import * as Root from '../root/root.js';
import * as UI from '../ui/ui.js';
let loadedProfilerModule;
export const UIStrings = {
    /**
    *@description Title for the profiler tab
    */
    memory: 'Memory',
    /**
    *@description Title of the 'Live Heap Profile' tool in the bottom drawer
    */
    liveHeapProfile: 'Live Heap Profile',
    /**
    *@description Title of an action under the Performance category that can be invoked through the Command Menu
    */
    startRecordingHeapAllocations: 'Start recording heap allocations',
    /**
    *@description Title of an action under the Performance category that can be invoked through the Command Menu
    */
    stopRecordingHeapAllocations: 'Stop recording heap allocations',
    /**
    *@description Title of an action in the live heap profile tool to start with reload
    */
    startRecordingHeapAllocationsAndReload: 'Start recording heap allocations and reload the page',
    /**
    *@description Text in the Shortcuts page to explain a keyboard shortcut (start/stop recording performance)
    */
    startStopRecording: 'Start/stop recording',
    /**
    *@description Title of a setting under the Performance category in Settings
    */
    showNativeFunctions: 'Show native functions in JS Profile',
};
const str_ = i18n.i18n.registerUIStrings('profiler/profiler-meta.ts', UIStrings);
const i18nString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
async function loadProfilerModule() {
    if (!loadedProfilerModule) {
        // Side-effect import resources in module.json
        await Root.Runtime.Runtime.instance().loadModulePromise('profiler');
        loadedProfilerModule = await import('./profiler.js');
    }
    return loadedProfilerModule;
}
function maybeRetrieveContextTypes(getClassCallBack) {
    if (loadedProfilerModule === undefined) {
        return [];
    }
    return getClassCallBack(loadedProfilerModule);
}
UI.ViewManager.registerViewExtension({
    location: "panel" /* PANEL */,
    id: 'heap_profiler',
    commandPrompt: 'Show Memory',
    title: i18nString(UIStrings.memory),
    order: 60,
    async loadView() {
        const Profiler = await loadProfilerModule();
        return Profiler.HeapProfilerPanel.HeapProfilerPanel.instance();
    },
});
UI.ViewManager.registerViewExtension({
    location: "drawer-view" /* DRAWER_VIEW */,
    id: 'live_heap_profile',
    commandPrompt: 'Show Live Heap Profile',
    title: i18nString(UIStrings.liveHeapProfile),
    persistence: "closeable" /* CLOSEABLE */,
    order: 100,
    async loadView() {
        const Profiler = await loadProfilerModule();
        return Profiler.LiveHeapProfileView.LiveHeapProfileView.instance();
    },
    experiment: Root.Runtime.ExperimentName.LIVE_HEAP_PROFILE,
});
UI.ActionRegistration.registerActionExtension({
    actionId: 'live-heap-profile.toggle-recording',
    iconClass: "largeicon-start-recording" /* LARGEICON_START_RECORDING */,
    toggleable: true,
    toggledIconClass: "largeicon-stop-recording" /* LARGEICON_STOP_RECORDING */,
    toggleWithRedColor: true,
    async loadActionDelegate() {
        const Profiler = await loadProfilerModule();
        return Profiler.LiveHeapProfileView.ActionDelegate.instance();
    },
    category: UI.ActionRegistration.ActionCategory.MEMORY,
    experiment: Root.Runtime.ExperimentName.LIVE_HEAP_PROFILE,
    options: [
        {
            value: true,
            title: i18nString(UIStrings.startRecordingHeapAllocations),
        },
        {
            value: false,
            title: i18nString(UIStrings.stopRecordingHeapAllocations),
        },
    ],
});
UI.ActionRegistration.registerActionExtension({
    actionId: 'live-heap-profile.start-with-reload',
    iconClass: "largeicon-refresh" /* LARGEICON_REFRESH */,
    async loadActionDelegate() {
        const Profiler = await loadProfilerModule();
        return Profiler.LiveHeapProfileView.ActionDelegate.instance();
    },
    category: UI.ActionRegistration.ActionCategory.MEMORY,
    experiment: Root.Runtime.ExperimentName.LIVE_HEAP_PROFILE,
    title: i18nString(UIStrings.startRecordingHeapAllocationsAndReload),
});
UI.ActionRegistration.registerActionExtension({
    actionId: 'profiler.heap-toggle-recording',
    category: UI.ActionRegistration.ActionCategory.MEMORY,
    iconClass: "largeicon-start-recording" /* LARGEICON_START_RECORDING */,
    title: i18nString(UIStrings.startStopRecording),
    toggleable: true,
    toggledIconClass: "largeicon-stop-recording" /* LARGEICON_STOP_RECORDING */,
    toggleWithRedColor: true,
    contextTypes() {
        return maybeRetrieveContextTypes(Profiler => [Profiler.HeapProfilerPanel.HeapProfilerPanel]);
    },
    async loadActionDelegate() {
        const Profiler = await loadProfilerModule();
        return Profiler.HeapProfilerPanel.HeapProfilerPanel.instance();
    },
    bindings: [
        {
            platform: "windows,linux" /* WindowsLinux */,
            shortcut: 'Ctrl+E',
        },
        {
            platform: "mac" /* Mac */,
            shortcut: 'Meta+E',
        },
    ],
});
UI.ActionRegistration.registerActionExtension({
    actionId: 'profiler.js-toggle-recording',
    category: UI.ActionRegistration.ActionCategory.JAVASCRIPT_PROFILER,
    title: i18nString(UIStrings.startStopRecording),
    iconClass: "largeicon-start-recording" /* LARGEICON_START_RECORDING */,
    toggleable: true,
    toggledIconClass: "largeicon-stop-recording" /* LARGEICON_STOP_RECORDING */,
    toggleWithRedColor: true,
    contextTypes() {
        return maybeRetrieveContextTypes(Profiler => [Profiler.ProfilesPanel.JSProfilerPanel]);
    },
    async loadActionDelegate() {
        const Profiler = await loadProfilerModule();
        return Profiler.ProfilesPanel.JSProfilerPanel.instance();
    },
    bindings: [
        {
            platform: "windows,linux" /* WindowsLinux */,
            shortcut: 'Ctrl+E',
        },
        {
            platform: "mac" /* Mac */,
            shortcut: 'Meta+E',
        },
    ],
});
Common.Settings.registerSettingExtension({
    category: Common.Settings.SettingCategoryObject.PERFORMANCE,
    title: i18nString(UIStrings.showNativeFunctions),
    settingName: 'showNativeFunctionsInJSProfile',
    settingType: Common.Settings.SettingTypeObject.BOOLEAN,
    defaultValue: true,
});
