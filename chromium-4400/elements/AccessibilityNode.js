// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Platform from '../platform/platform.js';
import { ls } from '../platform/platform.js';
import * as LitHtml from '../third_party/lit-html/lit-html.js';
export class AccessibilityNode extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.axNode = null;
        this.expanded = true;
        this.addEventListener('click', this.onClick.bind(this));
    }
    set data(data) {
        this.axNode = data.axNode;
        this.shadow.host.setAttribute('role', 'treeitem');
        this.render();
    }
    onClick(e) {
        e.stopPropagation();
        this.toggleChildren();
    }
    toggleChildren() {
        if (!this.axNode) {
            return;
        }
        const children = this.axNode.children;
        if (!children) {
            return;
        }
        this.expanded = !this.expanded;
        this.classList.toggle('expanded', this.expanded);
    }
    // TODO(annabelzhou): Track whether the children should be expanded and change arrow accordingly
    renderChildren(node) {
        if (!node) {
            return LitHtml.html ``;
        }
        const children = [];
        for (const child of node.children) {
            const childTemplate = LitHtml.html `
        <devtools-accessibility-node .data=${{
                axNode: child,
            }}>
        </devtools-accessibility-node>
      `;
            children.push(childTemplate);
        }
        return LitHtml.html `<div role='group' class='children'>${children}</div>`;
    }
    // This function is a variant of setTextContentTruncatedIfNeeded found in DOMExtension.
    truncateTextIfNeeded(text) {
        const maxTextContentLength = 10000;
        if (text.length > maxTextContentLength) {
            return Platform.StringUtilities.trimMiddle(text, maxTextContentLength);
        }
        return text;
    }
    renderNodeContent() {
        const nodeContent = [];
        if (!this.axNode) {
            return nodeContent;
        }
        const role = this.axNode.role;
        if (!role) {
            return nodeContent;
        }
        const roleElement = LitHtml.html `<span class='monospace'>${this.truncateTextIfNeeded(role || '')}</span>`;
        nodeContent.push(LitHtml.html `${roleElement}`);
        const name = this.axNode.name;
        if (name) {
            nodeContent.push(LitHtml.html `<span class='separator'>\xA0</span>`);
            nodeContent.push(LitHtml.html `<span class='ax-readable-string'>"${name}"</span>`);
        }
        return nodeContent;
    }
    render() {
        if (!this.axNode) {
            return;
        }
        const parts = [];
        // TODO(annabelzhou): Ignored nodes (and their potential children) to be handled in the future.
        if (this.axNode.ignored) {
            parts.push(LitHtml.html `<span class='monospace ignored-node'>${ls `Ignored`}</span>`);
        }
        else {
            const nodeContent = this.renderNodeContent();
            if (this.axNode.hasOnlyUnloadedChildren) {
                this.shadow.host.classList.add('parent');
                this.expanded = false;
            }
            else if (this.axNode.numChildren) {
                this.shadow.host.classList.add('parent', 'expanded');
            }
            else {
                this.shadow.host.classList.add('no-children');
            }
            parts.push(LitHtml.html `${nodeContent}`);
        }
        const children = this.renderChildren(this.axNode);
        parts.push(children);
        // clang-format off
        const output = LitHtml.html `
      <style>
          .ax-readable-string {
            font-style: italic;
          }

          .monospace {
            font-family: var(--monospace-font-family);
            font-size: var(--monospace-font-size);
          }

          .ignored-node {
            font-style: italic;
            opacity: 70%;
          }

          :host {
            align-items: center;
            display: block;
            margin: 0;
            min-height: 16px;
            overflow-x: hidden;
            padding-left: 4px;
            padding-right: 4px;
            position: relative;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          span {
            flex-shrink: 0;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .children {
            padding-inline-start: 12px;
          }

          :host(:not(.expanded)) .children {
            display: none;
          }

          :host(.no-children) {
            margin-left: 16px;
          }

          :host(.parent)::before {
            box-sizing: border-box;
            user-select: none;
            -webkit-mask-image: url(Images/treeoutlineTriangles.svg);
            -webkit-mask-size: 32px 24px;
            content: '\A0';
            color: transparent;
            text-shadow: none;
            margin-right: -3px;
            -webkit-mask-position: 0 0;
            background-color: var(--color-syntax-7);
          }

          :host(.parent.expanded)::before {
            -webkit-mask-position: -16px 0;
          }

      </style>
      ${parts}
      `;
        // clang-format on
        LitHtml.render(output, this.shadow);
    }
}
if (!customElements.get('devtools-accessibility-node')) {
    customElements.define('devtools-accessibility-node', AccessibilityNode);
}
//# sourceMappingURL=AccessibilityNode.js.map