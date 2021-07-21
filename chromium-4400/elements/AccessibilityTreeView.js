// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as UI from '../ui/ui.js';
import { AccessibilityTree } from './AccessibilityTree.js';
// This class simply acts as a wrapper around the AccessibilityTree web component for
// compatibility with DevTools legacy UI widgets. It in itself contains no business logic
// or functionality.
export class AccessibilityTreeView extends UI.Widget.VBox {
    constructor(toggleButton) {
        super();
        this.accessibilityTreeComponent = new AccessibilityTree();
        // toggleButton is bound to a click handler on ElementsPanel to switch between the DOM tree
        // and accessibility tree views.
        this.toggleButton = toggleButton;
        this.contentElement.appendChild(this.toggleButton);
        this.contentElement.appendChild(this.accessibilityTreeComponent);
    }
    setNode(inspectedNode) {
        this.accessibilityTreeComponent.data = {
            node: inspectedNode,
        };
    }
}
//# sourceMappingURL=AccessibilityTreeView.js.map