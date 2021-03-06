// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as UI from '../ui/ui.js';
export class AccessibilitySubPane extends UI.View.SimpleView {
    /**
     * @param {string} name
     */
    constructor(name) {
        super(name);
        /**
         * @protected
         * @type {?SDK.AccessibilityModel.AccessibilityNode}
         */
        this._axNode = null;
        this.registerRequiredCSS('accessibility/accessibilityProperties.css', { enableLegacyPatching: false });
    }
    /**
     * @param {?SDK.AccessibilityModel.AccessibilityNode} axNode
     */
    setAXNode(axNode) {
    }
    /**
     * @return {?SDK.DOMModel.DOMNode}
     */
    node() {
        return this._node || null;
    }
    /**
     * @param {?SDK.DOMModel.DOMNode} node
     */
    setNode(node) {
        this._node = node;
    }
    /**
     * @param {string} textContent
     * @param {string=} className
     * @return {!Element}
     */
    createInfo(textContent, className) {
        const classNameOrDefault = className || 'gray-info-message';
        const info = this.element.createChild('div', classNameOrDefault);
        info.textContent = textContent;
        return info;
    }
    /**
     * @return {!UI.TreeOutline.TreeOutline}
     */
    createTreeOutline() {
        const treeOutline = new UI.TreeOutline.TreeOutlineInShadow();
        treeOutline.registerRequiredCSS('accessibility/accessibilityNode.css', { enableLegacyPatching: false });
        treeOutline.registerRequiredCSS('accessibility/accessibilityProperties.css', { enableLegacyPatching: false });
        treeOutline.registerRequiredCSS('object_ui/objectValue.css', { enableLegacyPatching: true });
        treeOutline.element.classList.add('hidden');
        treeOutline.hideOverflow();
        this.element.appendChild(treeOutline.element);
        return treeOutline;
    }
}
//# sourceMappingURL=AccessibilitySubPane.js.map