/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
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
import * as UI from '../ui/ui.js';
import { Events as OverviewGridEvents, OverviewGrid } from './OverviewGrid.js';
export class TimelineOverviewPane extends UI.Widget.VBox {
    /**
     * @param {string} prefix
     */
    constructor(prefix) {
        super();
        this.element.id = prefix + '-overview-pane';
        this._overviewCalculator = new TimelineOverviewCalculator();
        this._overviewGrid = new OverviewGrid(prefix, this._overviewCalculator);
        this.element.appendChild(this._overviewGrid.element);
        this._cursorArea = this._overviewGrid.element.createChild('div', 'overview-grid-cursor-area');
        this._cursorElement = this._overviewGrid.element.createChild('div', 'overview-grid-cursor-position');
        this._cursorArea.addEventListener('mousemove', this._onMouseMove.bind(this), true);
        this._cursorArea.addEventListener('mouseleave', this._hideCursor.bind(this), true);
        this._overviewGrid.setResizeEnabled(false);
        this._overviewGrid.addEventListener(OverviewGridEvents.WindowChanged, this._onWindowChanged, this);
        this._overviewGrid.setClickHandler(this._onClick.bind(this));
        /** @type {!Array.<!TimelineOverview>} */
        this._overviewControls = [];
        this._markers = new Map();
        this._overviewInfo = new OverviewInfo(this._cursorElement);
        this._updateThrottler = new Common.Throttler.Throttler(100);
        this._cursorEnabled = false;
        this._cursorPosition = 0;
        this._lastWidth = 0;
        this._windowStartTime = 0;
        this._windowEndTime = Infinity;
        this._muteOnWindowChanged = false;
    }
    /**
     * @param {!Event} event
     */
    _onMouseMove(event) {
        if (!this._cursorEnabled) {
            return;
        }
        const mouseEvent = /** @type {!MouseEvent} */ (event);
        const target = /** @type {!HTMLElement} */ (event.target);
        this._cursorPosition = mouseEvent.offsetX + target.offsetLeft;
        this._cursorElement.style.left = this._cursorPosition + 'px';
        this._cursorElement.style.visibility = 'visible';
        this._overviewInfo.setContent(this._buildOverviewInfo());
    }
    /**
     * @return {!Promise<!DocumentFragment>}
     */
    async _buildOverviewInfo() {
        const document = this.element.ownerDocument;
        const x = this._cursorPosition;
        const elements = await Promise.all(this._overviewControls.map(control => control.overviewInfoPromise(x)));
        const fragment = document.createDocumentFragment();
        const nonNullElements = /** @type {!Array.<!Element>} */ (elements.filter(element => element !== null));
        fragment.append(...nonNullElements);
        return fragment;
    }
    _hideCursor() {
        this._cursorElement.style.visibility = 'hidden';
        this._overviewInfo.hide();
    }
    /**
     * @override
     */
    wasShown() {
        this._update();
    }
    /**
     * @override
     */
    willHide() {
        this._overviewInfo.hide();
    }
    /**
     * @override
     */
    onResize() {
        const width = this.element.offsetWidth;
        if (width === this._lastWidth) {
            return;
        }
        this._lastWidth = width;
        this.scheduleUpdate();
    }
    /**
     * @param {!Array.<!TimelineOverview>} overviewControls
     */
    setOverviewControls(overviewControls) {
        for (let i = 0; i < this._overviewControls.length; ++i) {
            this._overviewControls[i].dispose();
        }
        for (let i = 0; i < overviewControls.length; ++i) {
            overviewControls[i].setCalculator(this._overviewCalculator);
            overviewControls[i].show(this._overviewGrid.element);
        }
        this._overviewControls = overviewControls;
        this._update();
    }
    /**
     * @param {number} minimumBoundary
     * @param {number} maximumBoundary
     */
    setBounds(minimumBoundary, maximumBoundary) {
        this._overviewCalculator.setBounds(minimumBoundary, maximumBoundary);
        this._overviewGrid.setResizeEnabled(true);
        this._cursorEnabled = true;
    }
    /**
     * @param {!Map<string, !SDK.TracingModel.Event>} navStartTimes
     */
    setNavStartTimes(navStartTimes) {
        this._overviewCalculator.setNavStartTimes(navStartTimes);
    }
    scheduleUpdate() {
        this._updateThrottler.schedule(async () => {
            this._update();
        });
    }
    _update() {
        if (!this.isShowing()) {
            return;
        }
        this._overviewCalculator.setDisplayWidth(this._overviewGrid.clientWidth());
        for (let i = 0; i < this._overviewControls.length; ++i) {
            this._overviewControls[i].update();
        }
        this._overviewGrid.updateDividers(this._overviewCalculator);
        this._updateMarkers();
        this._updateWindow();
    }
    /**
     * @param {!Map<number, !Element>} markers
     */
    setMarkers(markers) {
        this._markers = markers;
    }
    _updateMarkers() {
        const filteredMarkers = new Map();
        for (const time of this._markers.keys()) {
            const marker = this._markers.get(time);
            const position = Math.round(this._overviewCalculator.computePosition(time));
            // Limit the number of markers to one per pixel.
            if (filteredMarkers.has(position)) {
                continue;
            }
            filteredMarkers.set(position, marker);
            marker.style.left = position + 'px';
        }
        this._overviewGrid.removeEventDividers();
        this._overviewGrid.addEventDividers([...filteredMarkers.values()]);
    }
    reset() {
        this._windowStartTime = 0;
        this._windowEndTime = Infinity;
        this._overviewCalculator.reset();
        this._overviewGrid.reset();
        this._overviewGrid.setResizeEnabled(false);
        this._cursorEnabled = false;
        this._hideCursor();
        this._markers = new Map();
        for (const control of this._overviewControls) {
            control.reset();
        }
        this._overviewInfo.hide();
        this.scheduleUpdate();
    }
    /**
     * @param {!Event} event
     * @return {boolean}
     */
    _onClick(event) {
        return this._overviewControls.some(control => control.onClick(event));
    }
    /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
    _onWindowChanged(event) {
        if (this._muteOnWindowChanged) {
            return;
        }
        // Always use first control as a time converter.
        if (!this._overviewControls.length) {
            return;
        }
        this._windowStartTime = event.data.rawStartValue;
        this._windowEndTime = event.data.rawEndValue;
        const windowTimes = { startTime: this._windowStartTime, endTime: this._windowEndTime };
        this.dispatchEventToListeners(Events.WindowChanged, windowTimes);
    }
    /**
     * @param {number} startTime
     * @param {number} endTime
     */
    setWindowTimes(startTime, endTime) {
        if (startTime === this._windowStartTime && endTime === this._windowEndTime) {
            return;
        }
        this._windowStartTime = startTime;
        this._windowEndTime = endTime;
        this._updateWindow();
        this.dispatchEventToListeners(Events.WindowChanged, { startTime: startTime, endTime: endTime });
    }
    _updateWindow() {
        if (!this._overviewControls.length) {
            return;
        }
        const absoluteMin = this._overviewCalculator.minimumBoundary();
        const timeSpan = this._overviewCalculator.maximumBoundary() - absoluteMin;
        const haveRecords = absoluteMin > 0;
        const left = haveRecords && this._windowStartTime ? Math.min((this._windowStartTime - absoluteMin) / timeSpan, 1) : 0;
        const right = haveRecords && this._windowEndTime < Infinity ? (this._windowEndTime - absoluteMin) / timeSpan : 1;
        this._muteOnWindowChanged = true;
        this._overviewGrid.setWindow(left, right);
        this._muteOnWindowChanged = false;
    }
}
/** @enum {symbol} */
export const Events = {
    WindowChanged: Symbol('WindowChanged')
};
/**
 * @implements {Calculator}
 */
export class TimelineOverviewCalculator {
    constructor() {
        this.reset();
        /** @type {number} */
        this._minimumBoundary;
        /** @type {number} */
        this._maximumBoundary;
        /** @type {number} */
        this._workingArea;
    }
    /**
     * @override
     * @param {number} time
     * @return {number}
     */
    computePosition(time) {
        return (time - this._minimumBoundary) / this.boundarySpan() * this._workingArea;
    }
    /**
     * @param {number} position
     * @return {number}
     */
    positionToTime(position) {
        return position / this._workingArea * this.boundarySpan() + this._minimumBoundary;
    }
    /**
     * @param {number} minimumBoundary
     * @param {number} maximumBoundary
     */
    setBounds(minimumBoundary, maximumBoundary) {
        this._minimumBoundary = minimumBoundary;
        this._maximumBoundary = maximumBoundary;
    }
    /**
     * @param {!Map<string, !SDK.TracingModel.Event>} navStartTimes
     */
    setNavStartTimes(navStartTimes) {
        this._navStartTimes = navStartTimes;
    }
    /**
     * @param {number} clientWidth
     */
    setDisplayWidth(clientWidth) {
        this._workingArea = clientWidth;
    }
    reset() {
        this.setBounds(0, 100);
    }
    /**
     * @override
     * @param {number} value
     * @param {number=} precision
     * @return {string}
     */
    formatValue(value, precision) {
        // If there are nav start times the value needs to be remapped.
        if (this._navStartTimes) {
            // Find the latest possible nav start time which is considered earlier
            // than the value passed through.
            const navStartTimes = Array.from(this._navStartTimes.values());
            for (let i = navStartTimes.length - 1; i >= 0; i--) {
                if (value > navStartTimes[i].startTime) {
                    value -= (navStartTimes[i].startTime - this.zeroTime());
                    break;
                }
            }
        }
        return Number.preciseMillisToString(value - this.zeroTime(), precision);
    }
    /**
     * @override
     * @return {number}
     */
    maximumBoundary() {
        return this._maximumBoundary;
    }
    /**
     * @override
     * @return {number}
     */
    minimumBoundary() {
        return this._minimumBoundary;
    }
    /**
     * @override
     * @return {number}
     */
    zeroTime() {
        return this._minimumBoundary;
    }
    /**
     * @override
     * @return {number}
     */
    boundarySpan() {
        return this._maximumBoundary - this._minimumBoundary;
    }
}
/**
 * @interface
 */
export class TimelineOverview {
    /**
     * @param {!Element} parentElement
     * @param {?Element=} insertBefore
     */
    show(parentElement, insertBefore) {
    }
    update() {
    }
    dispose() {
    }
    reset() {
    }
    /**
     * @param {number} x
     * @return {!Promise<?Element>}
     */
    overviewInfoPromise(x) {
        throw new Error('Not implemented');
    }
    /**
     * @param {!Event} event
     * @return {boolean}
     */
    onClick(event) {
        throw new Error('Not implemented');
    }
    /**
     * @param {!TimelineOverviewCalculator} calculator
     */
    setCalculator(calculator) {
    }
}
/**
 * @implements {TimelineOverview}
 */
export class TimelineOverviewBase extends UI.Widget.VBox {
    constructor() {
        super();
        /** @type {?TimelineOverviewCalculator} */
        this._calculator = null;
        /** @type {!HTMLCanvasElement} */
        this._canvas = /** @type {!HTMLCanvasElement} */ (this.element.createChild('canvas', 'fill'));
        this._context = this._canvas.getContext('2d');
    }
    /** @return {number} */
    width() {
        return this._canvas.width;
    }
    /** @return {number} */
    height() {
        return this._canvas.height;
    }
    /** @return {!CanvasRenderingContext2D} */
    context() {
        if (!this._context) {
            throw new Error('Unable to retrieve canvas context');
        }
        return /** @type {!CanvasRenderingContext2D} */ (this._context);
    }
    /**
     * @protected
     * @return {?TimelineOverviewCalculator}
     */
    calculator() {
        return this._calculator;
    }
    /**
     * @override
     */
    update() {
        this.resetCanvas();
    }
    /**
     * @override
     */
    dispose() {
        this.detach();
    }
    /**
     * @override
     */
    reset() {
    }
    /**
     * @override
     * @param {number} x
     * @return {!Promise<?Element>}
     */
    overviewInfoPromise(x) {
        return Promise.resolve(/** @type {?Element} */ (null));
    }
    /**
     * @override
     * @param {!TimelineOverviewCalculator} calculator
     */
    setCalculator(calculator) {
        this._calculator = calculator;
    }
    /**
     * @override
     * @param {!Event} event
     * @return {boolean}
     */
    onClick(event) {
        return false;
    }
    resetCanvas() {
        if (this.element.clientWidth) {
            this.setCanvasSize(this.element.clientWidth, this.element.clientHeight);
        }
    }
    /**
     * @param {number} width
     * @param {number} height
     */
    setCanvasSize(width, height) {
        this._canvas.width = width * window.devicePixelRatio;
        this._canvas.height = height * window.devicePixelRatio;
    }
}
export class OverviewInfo {
    /**
     * @param {!Element} anchor
     */
    constructor(anchor) {
        this._anchorElement = anchor;
        this._glassPane = new UI.GlassPane.GlassPane();
        this._glassPane.setPointerEventsBehavior(UI.GlassPane.PointerEventsBehavior.PierceContents);
        this._glassPane.setMarginBehavior(UI.GlassPane.MarginBehavior.Arrow);
        this._glassPane.setSizeBehavior(UI.GlassPane.SizeBehavior.MeasureContent);
        this._visible = false;
        this._element =
            UI.Utils
                .createShadowRootWithCoreStyles(this._glassPane.contentElement, { cssFile: 'perf_ui/timelineOverviewInfo.css', enableLegacyPatching: false, delegatesFocus: undefined })
                .createChild('div', 'overview-info');
    }
    /**
     * @param {!Promise<!DocumentFragment>} contentPromise
     */
    async setContent(contentPromise) {
        this._visible = true;
        const content = await contentPromise;
        if (!this._visible) {
            return;
        }
        this._element.removeChildren();
        this._element.appendChild(content);
        this._glassPane.setContentAnchorBox(this._anchorElement.boxInWindow());
        if (!this._glassPane.isShowing()) {
            this._glassPane.show(/** @type {!Document} */ (this._anchorElement.ownerDocument));
        }
    }
    hide() {
        this._visible = false;
        this._glassPane.hide();
    }
}
//# sourceMappingURL=TimelineOverviewPane.js.map