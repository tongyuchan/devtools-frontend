// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as SDK from '../sdk/sdk.js';
/**
 * @implements {UI.ActionRegistration.ActionDelegate}
 */
export class GCActionDelegate {
    /**
     * @override
     * @param {!UI.Context.Context} context
     * @param {string} actionId
     * @return {boolean}
     */
    handleAction(context, actionId) {
        for (const heapProfilerModel of SDK.SDKModel.TargetManager.instance().models(SDK.HeapProfilerModel.HeapProfilerModel)) {
            heapProfilerModel.collectGarbage();
        }
        return true;
    }
}
//# sourceMappingURL=GCActionDelegate.js.map