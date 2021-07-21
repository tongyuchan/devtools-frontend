// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { ls } from '../platform/platform.js';
import * as Root from '../root/root.js';
const registeredSettings = [];
const settingNameSet = new Set();
export function registerSettingExtension(registration) {
    const settingName = registration.settingName;
    if (settingNameSet.has(settingName)) {
        throw new Error(`Duplicate setting name '${settingName}'`);
    }
    settingNameSet.add(settingName);
    registeredSettings.push(registration);
}
export function getRegisteredSettings() {
    return registeredSettings.filter(setting => Root.Runtime.Runtime.isDescriptorEnabled({ experiment: setting.experiment, condition: setting.condition }));
}
export const SettingCategoryObject = {
    ELEMENTS: ls `Elements`,
    APPEARANCE: ls `Appearance`,
    SOURCES: ls `Sources`,
    NETWORK: ls `Network`,
    PERFORMANCE: ls `Performance`,
    CONSOLE: ls `Console`,
    PERSISTENCE: ls `Persistence`,
    DEBUGGER: ls `Debugger`,
    GLOBAL: ls `Global`,
    RENDERING: ls `Rendering`,
    GRID: ls `Grid`,
    MOBILE: ls `Mobile`,
    EMULATION: ls `Emulation`,
    MEMORY: ls `Memory`,
};
export const SettingTypeObject = {
    ARRAY: 'array',
    REGEX: 'regex',
    ENUM: 'enum',
    BOOLEAN: 'boolean',
};
//# sourceMappingURL=SettingRegistration.js.map