/*
 * Copyright (C) 2012 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import * as Common from '../common/common.js';
import * as SDK from '../sdk/sdk.js';
/** @type {!WeakMap<!Workspace.UISourceCode.UISourceCode, !Map<string, !{frame: !SDK.ResourceTreeModel.ResourceTreeFrame, count: number}>>} */
const uiSourceCodeToAttributionMap = new WeakMap();
/** @type {!WeakMap<!Workspace.Workspace.Project, !SDK.SDKModel.Target>} */
const projectToTargetMap = new WeakMap();
/**
 * @type {!NetworkProjectManager}
 */
let networkProjectManagerInstance;
export class NetworkProjectManager extends Common.ObjectWrapper.ObjectWrapper {
    /**
     * @private
     */
    constructor() {
        super();
    }
    /**
     * @param {{forceNew: boolean}} opts
     */
    static instance({ forceNew } = { forceNew: false }) {
        if (!networkProjectManagerInstance || forceNew) {
            networkProjectManagerInstance = new NetworkProjectManager();
        }
        return networkProjectManagerInstance;
    }
}
export const Events = {
    FrameAttributionAdded: Symbol('FrameAttributionAdded'),
    FrameAttributionRemoved: Symbol('FrameAttributionRemoved')
};
export class NetworkProject {
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @param {string} frameId
     */
    static _resolveFrame(uiSourceCode, frameId) {
        const target = NetworkProject.targetForUISourceCode(uiSourceCode);
        const resourceTreeModel = target && target.model(SDK.ResourceTreeModel.ResourceTreeModel);
        return resourceTreeModel ? resourceTreeModel.frameForId(frameId) : null;
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @param {string} frameId
     */
    static setInitialFrameAttribution(uiSourceCode, frameId) {
        const frame = NetworkProject._resolveFrame(uiSourceCode, frameId);
        if (!frame) {
            return;
        }
        /** @type {!Map<string, !{frame: !SDK.ResourceTreeModel.ResourceTreeFrame, count: number}>} */
        const attribution = new Map();
        attribution.set(frameId, { frame: frame, count: 1 });
        uiSourceCodeToAttributionMap.set(uiSourceCode, attribution);
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} fromUISourceCode
     * @param {!Workspace.UISourceCode.UISourceCode} toUISourceCode
     */
    static cloneInitialFrameAttribution(fromUISourceCode, toUISourceCode) {
        const fromAttribution = uiSourceCodeToAttributionMap.get(fromUISourceCode);
        if (!fromAttribution) {
            return;
        }
        /** @type {!Map<string, !{frame: !SDK.ResourceTreeModel.ResourceTreeFrame, count: number}>} */
        const toAttribution = new Map();
        for (const frameId of fromAttribution.keys()) {
            const value = fromAttribution.get(frameId);
            if (typeof value !== 'undefined') {
                toAttribution.set(frameId, { frame: value.frame, count: value.count });
            }
        }
        uiSourceCodeToAttributionMap.set(toUISourceCode, toAttribution);
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @param {string} frameId
     */
    static addFrameAttribution(uiSourceCode, frameId) {
        const frame = NetworkProject._resolveFrame(uiSourceCode, frameId);
        if (!frame) {
            return;
        }
        const frameAttribution = uiSourceCodeToAttributionMap.get(uiSourceCode);
        if (!frameAttribution) {
            return;
        }
        const attributionInfo = frameAttribution.get(frameId) || { frame: frame, count: 0 };
        attributionInfo.count += 1;
        frameAttribution.set(frameId, attributionInfo);
        if (attributionInfo.count !== 1) {
            return;
        }
        const data = { uiSourceCode: uiSourceCode, frame: frame };
        NetworkProjectManager.instance().dispatchEventToListeners(Events.FrameAttributionAdded, data);
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @param {string} frameId
     */
    static removeFrameAttribution(uiSourceCode, frameId) {
        const frameAttribution = uiSourceCodeToAttributionMap.get(uiSourceCode);
        if (!frameAttribution) {
            return;
        }
        const attributionInfo = frameAttribution.get(frameId);
        console.assert(Boolean(attributionInfo), 'Failed to remove frame attribution for url: ' + uiSourceCode.url());
        if (!attributionInfo) {
            return;
        }
        attributionInfo.count -= 1;
        if (attributionInfo.count > 0) {
            return;
        }
        frameAttribution.delete(frameId);
        const data = { uiSourceCode: uiSourceCode, frame: attributionInfo.frame };
        NetworkProjectManager.instance().dispatchEventToListeners(Events.FrameAttributionRemoved, data);
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @return {?SDK.SDKModel.Target} target
     */
    static targetForUISourceCode(uiSourceCode) {
        return projectToTargetMap.get(uiSourceCode.project()) || null;
    }
    /**
     * @param {!Workspace.Workspace.Project} project
     * @param {!SDK.SDKModel.Target} target
     */
    static setTargetForProject(project, target) {
        projectToTargetMap.set(project, target);
    }
    /**
     * @param {!Workspace.Workspace.Project} project
     * @return {?SDK.SDKModel.Target}
     */
    static getTargetForProject(project) {
        return projectToTargetMap.get(project) || null;
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @return {!Array<!SDK.ResourceTreeModel.ResourceTreeFrame>}
     */
    static framesForUISourceCode(uiSourceCode) {
        const target = NetworkProject.targetForUISourceCode(uiSourceCode);
        const resourceTreeModel = target && target.model(SDK.ResourceTreeModel.ResourceTreeModel);
        const attribution = uiSourceCodeToAttributionMap.get(uiSourceCode);
        if (!resourceTreeModel || !attribution) {
            return [];
        }
        const frames = Array.from(attribution.keys()).map(frameId => resourceTreeModel.frameForId(frameId));
        return /** @type {!Array<!SDK.ResourceTreeModel.ResourceTreeFrame>} */ (frames.filter(frame => Boolean(frame)));
    }
}
//# sourceMappingURL=NetworkProject.js.map