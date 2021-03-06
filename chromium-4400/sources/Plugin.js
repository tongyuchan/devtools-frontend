// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
export class Plugin {
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @return {boolean}
     */
    static accepts(uiSourceCode) {
        return false;
    }
    wasShown() {
    }
    willHide() {
    }
    /**
     * @return {!Promise<!Array<!UI.Toolbar.ToolbarItem>>}
     */
    async rightToolbarItems() {
        return [];
    }
    /**
     * @return {!Array<!UI.Toolbar.ToolbarItem>}
     *
     * TODO(szuend): It is OK to asyncify this function (similar to {rightToolbarItems}),
     *               but it is currently not strictly necessary.
     */
    leftToolbarItems() {
        return [];
    }
    /**
     * @param {!UI.ContextMenu.ContextMenu} contextMenu
     * @param {number} lineNumber
     * @return {!Promise<void>}
     */
    populateLineGutterContextMenu(contextMenu, lineNumber) {
        return Promise.resolve();
    }
    /**
     * @param {!UI.ContextMenu.ContextMenu} contextMenu
     * @param {number} lineNumber
     * @param {number} columnNumber
     * @return {!Promise<void>}
     */
    populateTextAreaContextMenu(contextMenu, lineNumber, columnNumber) {
        return Promise.resolve();
    }
    dispose() {
    }
}
//# sourceMappingURL=Plugin.js.map