// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { TimelineLoader } from './TimelineLoader.js'; // eslint-disable-line no-unused-vars
/**
 * @implements {Extensions.ExtensionTraceProvider.TracingSession}
 * @implements {Client}
 */
export class ExtensionTracingSession {
    /**
     * @param {!Extensions.ExtensionTraceProvider.ExtensionTraceProvider} provider
     * @param {!PerformanceModel} performanceModel
     */
    constructor(provider, performanceModel) {
        this._provider = provider;
        this._performanceModel = performanceModel;
        /** @type {function(): void} */
        this._completionCallback;
        /** @type {!Promise<void>} */
        this._completionPromise = new Promise(fulfill => {
            this._completionCallback = fulfill;
        });
        this._timeOffset = 0;
    }
    /** @override */
    loadingStarted() {
    }
    /** @override */
    processingStarted() {
    }
    /**
     * @override
     * @param {number=} progress
     */
    loadingProgress(progress) {
    }
    /**
     * @override
     * @param {?SDK.TracingModel.TracingModel} tracingModel
     */
    loadingComplete(tracingModel) {
        if (!tracingModel) {
            return;
        }
        this._performanceModel.addExtensionEvents(this._provider.longDisplayName(), tracingModel, this._timeOffset);
        this._completionCallback();
    }
    /**
     * @override
     * @param {string} url
     * @param {number} timeOffsetMicroseconds
     */
    complete(url, timeOffsetMicroseconds) {
        if (!url) {
            this._completionCallback();
            return;
        }
        this._timeOffset = timeOffsetMicroseconds;
        TimelineLoader.loadFromURL(url, this);
    }
    start() {
        this._provider.start(this);
    }
    /** @return {!Promise<void>} */
    stop() {
        this._provider.stop();
        return this._completionPromise;
    }
}
//# sourceMappingURL=ExtensionTracingSession.js.map