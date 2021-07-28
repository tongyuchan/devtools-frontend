// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as LitHtml from '../../third_party/lit-html/lit-html.js';
export class Report extends HTMLElement {
    constructor() {
        super(...arguments);
        this.shadow = this.attachShadow({ mode: 'open' });
        this.reportTitle = '';
    }
    set data({ reportTitle }) {
        this.reportTitle = reportTitle;
        this.render();
    }
    connectedCallback() {
        this.render();
    }
    render() {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        LitHtml.render(LitHtml.html `
      <style>
        .content {
          background-color: var(--color-background);
          overflow: auto;
          display: grid;
          grid-template-columns: min-content auto;
        }

        .report-title {
          padding: 12px 24px;
          font-size: 15px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          border-bottom: 1px solid var(--color-details-hairline);
          color: var(--color-text-primary);
          background-color: var(--color-background);
        }
      </style>

      ${this.reportTitle ? LitHtml.html `<div class="report-title">${this.reportTitle}</div>` : LitHtml.nothing}
      <div class="content">
        <slot></slot>
      </div>
    `, this.shadow);
        // clang-format on
    }
}
export class ReportSectionHeader extends HTMLElement {
    constructor() {
        super(...arguments);
        this.shadow = this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this.render();
    }
    render() {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        LitHtml.render(LitHtml.html `
      <style>
        :host {
          grid-column-start: span 2;
        }

        .section-header {
          padding: 12px;
          margin-left: 18px;
          display: flex;
          flex-direction: row;
          align-items: center;
          flex: auto;
          text-overflow: ellipsis;
          overflow: hidden;
          font-weight: bold;
          color: var(--color-text-primary);
        }
      </style>
      <div class="section-header">
        <slot></slot>
      </div>
    `, this.shadow);
        // clang-format on
    }
}
export class ReportSectionDivider extends HTMLElement {
    constructor() {
        super(...arguments);
        this.shadow = this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this.render();
    }
    render() {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        LitHtml.render(LitHtml.html `
      <style>
        :host {
          grid-column-start: span 2;
        }

        .section-divider {
          margin-top: 12px;
          border-bottom: 1px solid var(--color-details-hairline);
        }
      </style>
      <div class="section-divider">
      </div>
    `, this.shadow);
        // clang-format on
    }
}
export class ReportKey extends HTMLElement {
    constructor() {
        super(...arguments);
        this.shadow = this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this.render();
    }
    render() {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        LitHtml.render(LitHtml.html `
      <style>
        :host {
          line-height: 28px;
          margin: 8px 0 0 0;
        }

        .key {
          color: var(--color-text-secondary);
          padding: 0 6px;
          text-align: right;
          white-space: pre;
        }
      </style>
      <div class="key"><slot></slot></div>
    `, this.shadow);
        // clang-format on
    }
}
export class ReportValue extends HTMLElement {
    constructor() {
        super(...arguments);
        this.shadow = this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this.render();
    }
    render() {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        LitHtml.render(LitHtml.html `
      <style>
        :host {
          line-height: 28px;
          margin: 8px 0 0 0;
        }

        .value {
          color: var(--color-text-primary);
          margin-inline-start: 0;
          padding: 0 6px;
        }
      </style>
      <div class="value"><slot></slot></div>
    `, this.shadow);
        // clang-format on
    }
}
customElements.define('devtools-report', Report);
customElements.define('devtools-report-section-header', ReportSectionHeader);
customElements.define('devtools-report-key', ReportKey);
customElements.define('devtools-report-value', ReportValue);
customElements.define('devtools-report-divider', ReportSectionDivider);
