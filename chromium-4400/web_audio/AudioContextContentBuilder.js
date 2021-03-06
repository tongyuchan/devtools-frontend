// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/* eslint-disable rulesdir/no_underscored_properties */
import * as i18n from '../i18n/i18n.js';
import * as UI from '../ui/ui.js';
export const UIStrings = {
    /**
    *@description Text in Audio Context Content Builder
    */
    audiocontext: 'AudioContext',
    /**
    *@description Text in Audio Context Content Builder
    */
    offlineaudiocontext: 'OfflineAudioContext',
    /**
    *@description The current state of an item
    */
    state: 'State',
    /**
    *@description Text in Audio Context Content Builder
    */
    sampleRate: 'Sample Rate',
    /**
    *@description Text in Audio Context Content Builder
    */
    callbackBufferSize: 'Callback Buffer Size',
    /**
    *@description Text in Audio Context Content Builder
    */
    maxOutputChannels: 'Max Output Channels',
    /**
    *@description Text in Audio Context Content Builder
    */
    currentTime: 'Current Time',
    /**
    *@description Text in Audio Context Content Builder
    */
    callbackInterval: 'Callback Interval',
    /**
    *@description Text in Audio Context Content Builder
    */
    renderCapacity: 'Render Capacity',
};
const str_ = i18n.i18n.registerUIStrings('web_audio/AudioContextContentBuilder.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class ContextDetailBuilder {
    constructor(context) {
        this._fragment = document.createDocumentFragment();
        this._container = document.createElement('div');
        this._container.classList.add('context-detail-container');
        this._fragment.appendChild(this._container);
        this._build(context);
    }
    _build(context) {
        const title = context.contextType === 'realtime' ? i18nString(UIStrings.audiocontext) :
            i18nString(UIStrings.offlineaudiocontext);
        this._addTitle(title, context.contextId);
        this._addEntry(i18nString(UIStrings.state), context.contextState);
        this._addEntry(i18nString(UIStrings.sampleRate), context.sampleRate, 'Hz');
        if (context.contextType === 'realtime') {
            this._addEntry(i18nString(UIStrings.callbackBufferSize), context.callbackBufferSize, 'frames');
        }
        this._addEntry(i18nString(UIStrings.maxOutputChannels), context.maxOutputChannelCount, 'ch');
    }
    _addTitle(title, subtitle) {
        this._container.appendChild(UI.Fragment.html `
  <div class="context-detail-header">
  <div class="context-detail-title">${title}</div>
  <div class="context-detail-subtitle">${subtitle}</div>
  </div>
  `);
    }
    _addEntry(entry, value, unit) {
        const valueWithUnit = value + (unit ? ` ${unit}` : '');
        this._container.appendChild(UI.Fragment.html `
  <div class="context-detail-row">
  <div class="context-detail-row-entry">${entry}</div>
  <div class="context-detail-row-value">${valueWithUnit}</div>
  </div>
  `);
    }
    getFragment() {
        return this._fragment;
    }
}
export class ContextSummaryBuilder {
    constructor(contextId, contextRealtimeData) {
        const time = contextRealtimeData.currentTime.toFixed(3);
        const mean = (contextRealtimeData.callbackIntervalMean * 1000).toFixed(3);
        const stddev = (Math.sqrt(contextRealtimeData.callbackIntervalVariance) * 1000).toFixed(3);
        const capacity = (contextRealtimeData.renderCapacity * 100).toFixed(3);
        this._fragment = document.createDocumentFragment();
        this._fragment.appendChild(UI.Fragment.html `
  <div class="context-summary-container">
  <span>${i18nString(UIStrings.currentTime)}: ${time} s</span>
  <span>\u2758</span>
  <span>${i18nString(UIStrings.callbackInterval)}: ?? = ${mean} ms, ?? = ${stddev} ms</span>
  <span>\u2758</span>
  <span>${i18nString(UIStrings.renderCapacity)}: ${capacity} %</span>
  </div>
  `);
    }
    getFragment() {
        return this._fragment;
    }
}
//# sourceMappingURL=AudioContextContentBuilder.js.map