// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../common/common.js';
import { ls } from '../platform/platform.js';
import * as SDK from '../sdk/sdk.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';
import * as UI from '../ui/ui.js';
import { ApplicationPanelTreeElement } from './ApplicationPanelTreeElement.js';
export class TrustTokensTreeElement extends ApplicationPanelTreeElement {
    constructor(storagePanel) {
        super(storagePanel, Common.UIString.UIString('Trust Tokens'), false);
        const icon = UI.Icon.Icon.create('mediumicon-database', 'resource-tree-item');
        this.setLeadingIcons([icon]);
    }
    get itemURL() {
        return 'trustTokens://';
    }
    onselect(selectedByUser) {
        super.onselect(selectedByUser);
        if (!this.view) {
            this.view = new TrustTokensViewWidgetWrapper();
        }
        this.showView(this.view);
        return false;
    }
}
class TrustTokensViewWidgetWrapper extends UI.Widget.VBox {
    constructor() {
        super();
        this.trustTokensView = new TrustTokensView();
        this.contentElement.appendChild(this.trustTokensView);
    }
    async wasShown() {
        const mainTarget = SDK.SDKModel.TargetManager.instance().mainTarget();
        if (!mainTarget) {
            return;
        }
        const { tokens } = await mainTarget.storageAgent().invoke_getTrustTokens();
        this.trustTokensView.data = { tokens };
    }
}
export class TrustTokensView extends HTMLElement {
    constructor() {
        super(...arguments);
        this.shadow = this.attachShadow({ mode: 'open' });
        this.tokens = [];
    }
    connectedCallback() {
        this.render();
    }
    set data(data) {
        this.tokens = data.tokens;
        this.render();
    }
    render() {
        const gridData = {
            columns: [
                { id: 'issuer', title: ls `Issuer`, widthWeighting: 2, hideable: false, visible: true },
                { id: 'count', title: ls `Stored token count`, widthWeighting: 1, hideable: false, visible: true },
            ],
            rows: this.buildRowsFromTokens(),
            activeSort: null,
        };
        LitHtml.render(LitHtml.html `
      <style>
        :host {
          padding: 20px;
        }

        .heading {
          font-size: 15px;
        }

        devtools-data-grid {
          border: 1px solid var(--color-details-hairline);
          margin-top: 20px;
        }

        .info-icon {
          vertical-align: text-bottom;
          height: 14px;
        }
      </style>
      <div>
        <span class="heading">Trust Tokens</span>
        <devtools-icon class="info-icon" title=${ls `All stored Trust Tokens available in this browser instance.`}
          .data=${{ iconName: 'ic_info_black_18dp', color: 'var(--color-link)', width: '14px' }}>
        </devtools-icon>
        <devtools-data-grid .data=${gridData}></devtools-data-grid>
      </div>
    `, this.shadow);
    }
    buildRowsFromTokens() {
        const tokens = this.tokens.filter(token => token.count > 0);
        return tokens.map(token => ({
            cells: [
                { columnId: 'issuer', value: token.issuerOrigin },
                { columnId: 'count', value: token.count },
            ],
        }));
    }
}
customElements.define('devtools-trust-tokens-storage-view', TrustTokensView);
//# sourceMappingURL=TrustTokensView.js.map