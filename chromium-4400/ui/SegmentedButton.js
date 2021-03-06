// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { Tooltip } from './Tooltip.js';
import { HBox } from './Widget.js';
export class SegmentedButton extends HBox {
    constructor() {
        super(true);
        /** @type {!Map<string, !Element>} */
        this._buttons = new Map();
        /** @type {?string} */
        this._selected = null;
        this.registerRequiredCSS('ui/segmentedButton.css', { enableLegacyPatching: true });
        this.contentElement.classList.add('segmented-button');
    }
    /**
     * @param {string} label
     * @param {string} value
     * @param {string=} tooltip
     */
    addSegment(label, value, tooltip) {
        const button = this.contentElement.createChild('button', 'segmented-button-segment');
        button.textContent = label;
        if (tooltip) {
            Tooltip.install(button, tooltip);
        }
        this._buttons.set(value, button);
        button.addEventListener('click', () => this.select(value));
    }
    /**
     * @param {string} value
     */
    select(value) {
        if (this._selected === value) {
            return;
        }
        this._selected = value;
        for (const [key, button] of this._buttons) {
            button.classList.toggle('segmented-button-segment-selected', key === this._selected);
        }
    }
    /**
     * @return {?string}
     */
    selected() {
        return this._selected;
    }
}
//# sourceMappingURL=SegmentedButton.js.map