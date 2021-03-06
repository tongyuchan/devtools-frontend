// Copyright (c) 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { createShadowRootWithCoreStyles } from './utils/create-shadow-root-with-core-styles.js';
export class DropTarget {
    /**
     * @param {!Element} element
     * @param {!Array<{kind: string, type: !RegExp}>} transferTypes
     * @param {string} messageText
     * @param {function(!DataTransfer):*} handleDrop
     */
    constructor(element, transferTypes, messageText, handleDrop) {
        element.addEventListener('dragenter', this._onDragEnter.bind(this), true);
        element.addEventListener('dragover', this._onDragOver.bind(this), true);
        this._element = element;
        this._transferTypes = transferTypes;
        this._messageText = messageText;
        this._handleDrop = handleDrop;
        this._enabled = true;
        /** @type {?Element} */
        this._dragMaskElement = null;
    }
    /**
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this._enabled = enabled;
    }
    /**
     * @param {!Event} event
     */
    _onDragEnter(event) {
        if (this._enabled && this._hasMatchingType(event)) {
            event.consume(true);
        }
    }
    /**
     * @param {!Event} ev
     * @return {boolean}
     */
    _hasMatchingType(ev) {
        const event = /** @type {!DragEvent} */ (ev);
        if (!event.dataTransfer) {
            return false;
        }
        for (const transferType of this._transferTypes) {
            const found = Array.from(event.dataTransfer.items).find(item => {
                return transferType.kind === item.kind && Boolean(transferType.type.exec(item.type));
            });
            if (found) {
                return true;
            }
        }
        return false;
    }
    /**
     * @param {!Event} ev
     */
    _onDragOver(ev) {
        const event = /** @type {!DragEvent} */ (ev);
        if (!this._enabled || !this._hasMatchingType(event)) {
            return;
        }
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
        }
        event.consume(true);
        if (this._dragMaskElement) {
            return;
        }
        this._dragMaskElement = this._element.createChild('div', '');
        const shadowRoot = createShadowRootWithCoreStyles(this._dragMaskElement, { cssFile: 'ui/dropTarget.css', enableLegacyPatching: true, delegatesFocus: undefined });
        shadowRoot.createChild('div', 'drop-target-message').textContent = this._messageText;
        this._dragMaskElement.addEventListener('drop', this._onDrop.bind(this), true);
        this._dragMaskElement.addEventListener('dragleave', this._onDragLeave.bind(this), true);
    }
    /**
     * @param {!Event} ev
     */
    _onDrop(ev) {
        const event = /** @type {!DragEvent} */ (ev);
        event.consume(true);
        this._removeMask();
        if (this._enabled && event.dataTransfer) {
            this._handleDrop(event.dataTransfer);
        }
    }
    /**
     * @param {!Event} event
     */
    _onDragLeave(event) {
        event.consume(true);
        this._removeMask();
    }
    _removeMask() {
        if (this._dragMaskElement) {
            this._dragMaskElement.remove();
            this._dragMaskElement = null;
        }
    }
}
export const Type = {
    URI: { kind: 'string', type: /text\/uri-list/ },
    Folder: { kind: 'file', type: /$^/ },
    File: { kind: 'file', type: /.*/ },
    WebFile: { kind: 'file', type: /[\w]+/ },
    ImageFile: { kind: 'file', type: /image\/.*/ },
};
//# sourceMappingURL=DropTarget.js.map