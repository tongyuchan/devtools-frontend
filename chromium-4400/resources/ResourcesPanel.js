// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../common/common.js'; // eslint-disable-line no-unused-vars
import * as SDK from '../sdk/sdk.js';
import * as SourceFrame from '../source_frame/source_frame.js';
import * as UI from '../ui/ui.js';
import { ApplicationPanelSidebar, StorageCategoryView } from './ApplicationPanelSidebar.js'; // eslint-disable-line no-unused-vars
import { CookieItemsView } from './CookieItemsView.js';
import { DatabaseQueryView } from './DatabaseQueryView.js';
import { DatabaseTableView } from './DatabaseTableView.js';
import { DOMStorageItemsView } from './DOMStorageItemsView.js';
import { StorageItemsView } from './StorageItemsView.js';
/** @type {!ResourcesPanel} */
let resourcesPanelInstance;
export class ResourcesPanel extends UI.Panel.PanelWithSidebar {
    /**
     * @private
     */
    constructor() {
        super('resources');
        this.registerRequiredCSS('resources/resourcesPanel.css', { enableLegacyPatching: false });
        this._resourcesLastSelectedItemSetting =
            Common.Settings.Settings.instance().createSetting('resourcesLastSelectedElementPath', []);
        /** @type {?UI.Widget.Widget} */
        this.visibleView = null;
        /** @type {?Promise<!UI.Widget.Widget>} */
        this._pendingViewPromise = null;
        /** @type {?StorageCategoryView} */
        this._categoryView = null;
        const mainContainer = new UI.Widget.VBox();
        this.storageViews = mainContainer.element.createChild('div', 'vbox flex-auto');
        this._storageViewToolbar = new UI.Toolbar.Toolbar('resources-toolbar', mainContainer.element);
        this.splitWidget().setMainWidget(mainContainer);
        /** @type {?DOMStorageItemsView} */
        this._domStorageView = null;
        /** @type {?CookieItemsView} */
        this._cookieView = null;
        /** @type {?UI.EmptyWidget.EmptyWidget} */
        this._emptyWidget = null;
        this._sidebar = new ApplicationPanelSidebar(this);
        this._sidebar.show(this.panelSidebarElement());
    }
    /**
     * @param {{forceNew: ?boolean}} opts
     */
    static instance(opts = { forceNew: null }) {
        const { forceNew } = opts;
        if (!resourcesPanelInstance || forceNew) {
            resourcesPanelInstance = new ResourcesPanel();
        }
        return resourcesPanelInstance;
    }
    /**
     * @return {!ResourcesPanel}
     */
    static _instance() {
        return ResourcesPanel.instance();
    }
    /**
     * @param {!UI.Widget.Widget} view
     * @return {boolean}
     */
    static _shouldCloseOnReset(view) {
        const viewClassesToClose = [
            SourceFrame.ResourceSourceFrame.ResourceSourceFrame, SourceFrame.ImageView.ImageView,
            SourceFrame.FontView.FontView, StorageItemsView, DatabaseQueryView, DatabaseTableView
        ];
        return viewClassesToClose.some(type => view instanceof type);
    }
    /**
     * @override
     */
    focus() {
        this._sidebar.focus();
    }
    /**
     * @return {!Array<string>}
     */
    lastSelectedItemPath() {
        return this._resourcesLastSelectedItemSetting.get();
    }
    /**
     * @param {!Array<string>} path
     */
    setLastSelectedItemPath(path) {
        this._resourcesLastSelectedItemSetting.set(path);
    }
    resetView() {
        if (this.visibleView && ResourcesPanel._shouldCloseOnReset(this.visibleView)) {
            this.showView(null);
        }
    }
    /**
     * @param {?UI.Widget.Widget} view
     */
    showView(view) {
        this._pendingViewPromise = null;
        if (this.visibleView === view) {
            return;
        }
        if (this.visibleView) {
            this.visibleView.detach();
        }
        if (view) {
            view.show(this.storageViews);
        }
        this.visibleView = view;
        this._storageViewToolbar.removeToolbarItems();
        if (view instanceof UI.View.SimpleView) {
            view.toolbarItems().then(items => {
                items.map(item => this._storageViewToolbar.appendToolbarItem(item));
                this._storageViewToolbar.element.classList.toggle('hidden', !items.length);
            });
        }
    }
    /**
     * @param {!Promise<!UI.Widget.Widget>} viewPromise
     * @return {!Promise<?UI.Widget.Widget>}
     */
    async scheduleShowView(viewPromise) {
        this._pendingViewPromise = viewPromise;
        const view = await viewPromise;
        if (this._pendingViewPromise !== viewPromise) {
            return null;
        }
        this.showView(view);
        return view;
    }
    /**
     * @param {string} categoryName
     * @param {string|null} categoryLink
     */
    showCategoryView(categoryName, categoryLink) {
        if (!this._categoryView) {
            this._categoryView = new StorageCategoryView();
        }
        this._categoryView.setText(categoryName);
        this._categoryView.setLink(categoryLink);
        this.showView(this._categoryView);
    }
    /**
     * @param {!DOMStorage} domStorage
     */
    showDOMStorage(domStorage) {
        if (!domStorage) {
            return;
        }
        if (!this._domStorageView) {
            this._domStorageView = new DOMStorageItemsView(domStorage);
        }
        else {
            this._domStorageView.setStorage(domStorage);
        }
        this.showView(this._domStorageView);
    }
    /**
     * @param {!SDK.SDKModel.Target} cookieFrameTarget
     * @param {string} cookieDomain
     */
    showCookies(cookieFrameTarget, cookieDomain) {
        const model = cookieFrameTarget.model(SDK.CookieModel.CookieModel);
        if (!model) {
            return;
        }
        if (!this._cookieView) {
            this._cookieView = new CookieItemsView(model, cookieDomain);
        }
        else {
            this._cookieView.setCookiesDomain(model, cookieDomain);
        }
        this.showView(this._cookieView);
    }
    /**
     * @param {!SDK.SDKModel.Target} target
     * @param {string} cookieDomain
     */
    clearCookies(target, cookieDomain) {
        const model = /** @type {?SDK.CookieModel.CookieModel} */ (target.model(SDK.CookieModel.CookieModel));
        if (!model) {
            return;
        }
        model.clear(cookieDomain).then(() => {
            if (this._cookieView) {
                this._cookieView.refreshItems();
            }
        });
    }
}
/**
 * @implements {Common.Revealer.Revealer}
 */
export class ResourceRevealer {
    /**
     * @override
     * @param {!Object} resource
     * @return {!Promise<void>}
     */
    async reveal(resource) {
        if (!(resource instanceof SDK.Resource.Resource)) {
            return Promise.reject(new Error('Internal error: not a resource'));
        }
        const sidebar = ResourcesPanel._instance()._sidebar;
        await UI.ViewManager.ViewManager.instance().showView('resources');
        await sidebar.showResource(resource);
    }
}
/**
 * @implements {Common.Revealer.Revealer}
 */
export class CookieReferenceRevealer {
    /**
     * @override
     * @param {!Object} cookie
     * @return {!Promise<void>}
     */
    async reveal(cookie) {
        if (!(cookie instanceof SDK.Cookie.CookieReference)) {
            throw new Error('Internal error: not a cookie reference');
        }
        const sidebar = ResourcesPanel._instance()._sidebar;
        await UI.ViewManager.ViewManager.instance().showView('resources');
        await sidebar.cookieListTreeElement.select();
        const contextUrl = cookie.contextUrl();
        if (contextUrl && await this._revealByDomain(sidebar, contextUrl)) {
            return;
        }
        // Fallback: try to reveal the cookie using its domain as context, which may not work, because the
        // Application Panel shows cookies grouped by context, see crbug.com/1060563.
        this._revealByDomain(sidebar, cookie.domain());
    }
    /**
     * @param {!ApplicationPanelSidebar} sidebar
     * @param {string} domain
     * @returns {!Promise<boolean>}
     */
    async _revealByDomain(sidebar, domain) {
        const item = sidebar.cookieListTreeElement.children().find(c => /** @type {!CookieTreeElement} */ (c).cookieDomain().endsWith(domain));
        if (item) {
            await item.revealAndSelect();
            return true;
        }
        return false;
    }
}
//# sourceMappingURL=ResourcesPanel.js.map