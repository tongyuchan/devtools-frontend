// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as LitHtml from '../../third_party/lit-html/lit-html.js';
export class CounterButton extends HTMLElement {
    constructor() {
        super(...arguments);
        this.shadow = this.attachShadow({ mode: 'open' });
        this.clickHandler = () => { };
        this.counters = [];
    }
    set data(data) {
        this.counters = data.counters;
        this.clickHandler = data.clickHandler;
        this.render();
    }
    setCounts(counts) {
        if (counts.length !== this.counters.length) {
            throw new Error(`Wrong number of texts, expected ${this.counters.length} but got ${counts.length}`);
        }
        for (let i = 0; i < counts.length; ++i) {
            this.counters[i].count = counts[i];
        }
        this.render();
    }
    onClickHandler(event) {
        event.preventDefault();
        this.clickHandler();
    }
    render() {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        return LitHtml.render(LitHtml.html `
      <style>
        :host {
          white-space: normal;
        }

        .counter-button {
          cursor: pointer;
          background-color: var(--toolbar-bg-color);
          border: 1px solid var(--divider-color);
          border-radius: 2px;
          color: var(--tab-selected-fg-color);
          margin-right: 2px;
          display: inline-flex;
          align-items: center;
        }

        .counter-button:hover,
        .counter-button:focus-visible {
          background-color: var(--toolbar-hover-bg-color);
        }

        .counter-button-title {
          margin-left: 0.5ex;
        }

        .status-icon {
          margin-left: 1ex;
        }

        .status-icon:first-child {
          margin-left: inherit;
        }
      </style>
      <button class="counter-button" @click=${this.onClickHandler}>
      ${this.counters.filter(counter => Boolean(counter.count)).map(counter => LitHtml.html `
      <devtools-icon class="status-icon"
      .data=${{ iconName: counter.iconName, color: counter.iconColor || '', width: '1.5ex', height: '1.5ex' }}>
      </devtools-icon>
      <span class="counter-button-title">${counter.count}</span>
      </button>`)}
    `, this.shadow, { eventContext: this });
        // clang-format on
    }
}
customElements.define('counter-button', CounterButton);
//# sourceMappingURL=CounterButton.js.map