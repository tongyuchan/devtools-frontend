// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
export function SDKNodeToAXNode(parent, sdkNode) {
    const axChildren = [];
    const axNode = {
        id: sdkNode._id,
        role: sdkNode.role()?.value,
        name: sdkNode.name()?.value,
        ignored: sdkNode.ignored(),
        parent: parent,
        children: axChildren,
        numChildren: sdkNode.numChildren(),
        hasOnlyUnloadedChildren: sdkNode.hasOnlyUnloadedChildren(),
    };
    for (const child of sdkNode.children()) {
        axNode.children.push(SDKNodeToAXNode(axNode, child));
    }
    return axNode;
}
