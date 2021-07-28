import { ls } from '../platform/platform.js';
import * as Root from '../root/root.js';
import { PreRegisteredView } from './ViewManager.js';
const registeredViewExtensions = [];
const viewIdSet = new Set();
export function registerViewExtension(registration) {
    const viewId = registration.id;
    if (viewIdSet.has(viewId)) {
        throw new Error(`Duplicate view id '${viewId}': ${new Error().stack}`);
    }
    viewIdSet.add(viewId);
    registeredViewExtensions.push(new PreRegisteredView(registration));
}
export function getRegisteredViewExtensions() {
    return registeredViewExtensions.filter(view => Root.Runtime.Runtime.isDescriptorEnabled({ experiment: view.experiment(), condition: view.condition() }));
}
const registeredLocationResolvers = [];
const viewLocationNameSet = new Set();
export function registerLocationResolver(registration) {
    const locationName = registration.name;
    if (viewLocationNameSet.has(locationName)) {
        throw new Error(`Duplicate view location name registration '${locationName}'`);
    }
    viewLocationNameSet.add(locationName);
    registeredLocationResolvers.push(registration);
}
export function getRegisteredLocationResolvers() {
    return registeredLocationResolvers;
}
export const ViewLocationCategoryValues = {
    ELEMENTS: ls `Elements`,
    DRAWER: ls `Drawer`,
    DRAWER_SIDEBAR: ls `Drawer sidebar`,
    PANEL: ls `Panel`,
    NETWORK: ls `Network`,
    SETTINGS: ls `Settings`,
    SOURCES: ls `Sources`,
};
