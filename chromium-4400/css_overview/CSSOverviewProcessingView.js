// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../i18n/i18n.js';
import * as UI from '../ui/ui.js';
import { Events } from './CSSOverviewController.js'; // eslint-disable-line no-unused-vars
export const UIStrings = {
    /**
    *@description Text to cancel something
    */
    cancel: 'Cancel',
};
const str_ = i18n.i18n.registerUIStrings('css_overview/CSSOverviewProcessingView.js', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class CSSOverviewProcessingView extends UI.Widget.Widget {
    /**
     * @param {!OverviewController} controller
     */
    constructor(controller) {
        super();
        this.registerRequiredCSS('css_overview/cssOverviewProcessingView.css', { enableLegacyPatching: false });
        this._formatter = new Intl.NumberFormat('en-US');
        this._controller = controller;
        this._render();
    }
    _render() {
        const cancelButton = UI.UIUtils.createTextButton(i18nString(UIStrings.cancel), () => this._controller.dispatchEventToListeners(Events.RequestOverviewCancel), '', true /* primary */);
        this.setDefaultFocusedElement(cancelButton);
        this.fragment = UI.Fragment.Fragment.build `
      <div class="vbox overview-processing-view">
        <h1>Processing page</h1>
        <div>${cancelButton}</div>
      </div>
    `;
        this.contentElement.appendChild(this.fragment.element());
        this.contentElement.style.overflow = 'auto';
    }
}
//# sourceMappingURL=CSSOverviewProcessingView.js.map