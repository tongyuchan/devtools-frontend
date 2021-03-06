// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as LitHtml from '../third_party/lit-html/lit-html.js';
const { render, html } = LitHtml;
export class NodeText extends HTMLElement {
    constructor() {
        super(...arguments);
        this.shadow = this.attachShadow({ mode: 'open' });
        this.nodeTitle = '';
        this.nodeId = '';
        this.nodeClasses = [];
    }
    set data(data) {
        this.nodeTitle = data.nodeTitle;
        this.nodeId = data.nodeId;
        this.nodeClasses = data.nodeClasses;
        this.render();
    }
    render() {
        const hasId = Boolean(this.nodeId);
        const hasNodeClasses = Boolean(this.nodeClasses && this.nodeClasses.length > 0);
        const parts = [
            html `<span class="node-label-name">${this.nodeTitle}</span>`,
        ];
        if (this.nodeId) {
            const classes = LitHtml.Directives.classMap({
                'node-label-id': true,
                'node-multiple-descriptors': hasNodeClasses,
            });
            parts.push(html `<span class=${classes}>#${CSS.escape(this.nodeId)}</span>`);
        }
        if (this.nodeClasses && this.nodeClasses.length > 0) {
            const text = this.nodeClasses.map(c => `.${CSS.escape(c)}`).join('');
            const classes = LitHtml.Directives.classMap({
                'node-label-class': true,
                'node-multiple-descriptors': hasId,
            });
            parts.push(html `<span class=${classes}>${text}</span>`);
        }
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        render(html `
      <style>
        .node-label-name {
          color: var(--node-text-label-color, --dom-tag-name-color);
        }

        .node-label-class {
          color: var(--node-text-class-color, --dom-attribute-name-color);
        }

        .node-label-id {
          color: var(--node-text-id-color);
        }

        .node-label-class.node-multiple-descriptors {
          color: var(--node-text-multiple-descriptors-class, var(--node-text-class-color, --dom-attribute-name-color));
        }

        .node-label-id.node-multiple-descriptors {
          color: var(--node-text-multiple-descriptors-id, var(--node-text-id-color, --dom-attribute-name-color));
        }
      </style>
      ${parts}
    `, this.shadow, {
            eventContext: this,
        });
        // clang-format on
    }
}
if (!customElements.get('devtools-node-text')) {
    customElements.define('devtools-node-text', NodeText);
}
//# sourceMappingURL=NodeText.js.map