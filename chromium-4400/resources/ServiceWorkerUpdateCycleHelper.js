// Copyright (c) 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { ls } from '../platform/platform.js';
import * as SDK from '../sdk/sdk.js';
import * as UI from '../ui/ui.js';
export class ServiceWorkerUpdateCycleHelper {
    static calculateServiceWorkerUpdateRanges(registration) {
        function addRange(ranges, range) {
            if (range.start < Number.MAX_VALUE && range.start <= range.end) {
                ranges.push(range);
            }
        }
        /**
         * Add ranges representing Install, Wait or Activate of a sw version represented by id.
         */
        function addNormalizedRanges(ranges, id, startInstallTime, endInstallTime, startActivateTime, endActivateTime, status) {
            addRange(ranges, { id, phase: "Install" /* Install */, start: startInstallTime, end: endInstallTime });
            if (status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activating ||
                status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activated ||
                status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Redundant) {
                addRange(ranges, {
                    id,
                    phase: "Wait" /* Wait */,
                    start: endInstallTime,
                    end: startActivateTime,
                });
                addRange(ranges, { id, phase: "Activate" /* Activate */, start: startActivateTime, end: endActivateTime });
            }
        }
        function RangesForVersion(version) {
            let state = version.currentState;
            let endActivateTime = 0;
            let beginActivateTime = 0;
            let endInstallTime = 0;
            let beginInstallTime = 0;
            const currentStatus = state.status;
            if (currentStatus === Protocol.ServiceWorker.ServiceWorkerVersionStatus.New) {
                return [];
            }
            while (state) {
                // find the earliest timestamp of different stage on record.
                if (state.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activated) {
                    endActivateTime = state.last_updated_timestamp;
                }
                else if (state.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Activating) {
                    if (endActivateTime === 0) {
                        endActivateTime = state.last_updated_timestamp;
                    }
                    beginActivateTime = state.last_updated_timestamp;
                }
                else if (state.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installed) {
                    endInstallTime = state.last_updated_timestamp;
                }
                else if (state.status === Protocol.ServiceWorker.ServiceWorkerVersionStatus.Installing) {
                    if (endInstallTime === 0) {
                        endInstallTime = state.last_updated_timestamp;
                    }
                    beginInstallTime = state.last_updated_timestamp;
                }
                state = state.previousState;
            }
            /** @type {Array <ServiceWorkerUpdateRange>} */
            const ranges = [];
            addNormalizedRanges(ranges, version.id, beginInstallTime, endInstallTime, beginActivateTime, endActivateTime, currentStatus);
            return ranges;
        }
        const versions = registration.versionsByMode();
        const modes = [
            SDK.ServiceWorkerManager.ServiceWorkerVersion.Modes.Active,
            SDK.ServiceWorkerManager.ServiceWorkerVersion.Modes.Waiting,
            SDK.ServiceWorkerManager.ServiceWorkerVersion.Modes.Installing,
            SDK.ServiceWorkerManager.ServiceWorkerVersion.Modes.Redundant,
        ];
        for (const mode of modes) {
            const version = versions.get(mode);
            if (version) {
                const ranges = RangesForVersion(version);
                return ranges;
            }
        }
        return [];
    }
    static createTimingTable(registration) {
        const tableElement = document.createElement('table');
        tableElement.classList.add('service-worker-update-timing-table');
        UI.Utils.appendStyle(tableElement, 'resources/serviceWorkerUpdateCycleView.css');
        const timeRanges = this.calculateServiceWorkerUpdateRanges(registration);
        this.updateTimingTable(tableElement, timeRanges);
        return tableElement;
    }
    static createTimingTableHead(tableElement) {
        const serverHeader = tableElement.createChild('tr', 'service-worker-update-timing-table-header');
        UI.UIUtils.createTextChild(serverHeader.createChild('td'), ls `Version`);
        UI.UIUtils.createTextChild(serverHeader.createChild('td'), ls `Update Activity`);
        UI.UIUtils.createTextChild(serverHeader.createChild('td'), ls `Timeline`);
    }
    static removeRows(tableElement) {
        const rows = tableElement.getElementsByTagName('tr');
        while (rows[0]) {
            if (rows[0].parentNode) {
                rows[0].parentNode.removeChild(rows[0]);
            }
        }
    }
    static updateTimingTable(tableElement, timeRanges) {
        this.removeRows(tableElement);
        this.createTimingTableHead(tableElement);
        /** @type {!Array<ServiceWorkerUpdateRange>} */
        const timeRangeArray = timeRanges;
        if (timeRangeArray.length === 0) {
            return;
        }
        const startTimes = timeRangeArray.map(r => r.start);
        const endTimes = timeRangeArray.map(r => r.end);
        const startTime = startTimes.reduce((a, b) => Math.min(a, b));
        const endTime = endTimes.reduce((a, b) => Math.max(a, b));
        const scale = 100 / (endTime - startTime);
        for (const range of timeRangeArray) {
            const phaseName = range.phase;
            const left = (scale * (range.start - startTime));
            const right = (scale * (endTime - range.end));
            const tr = tableElement.createChild('tr');
            const timingBarVersionElement = tr.createChild('td');
            UI.UIUtils.createTextChild(timingBarVersionElement, '#' + range.id);
            timingBarVersionElement.classList.add('service-worker-update-timing-bar-clickable');
            timingBarVersionElement.setAttribute('tabindex', '0');
            const timingBarTitleElement = tr.createChild('td');
            UI.UIUtils.createTextChild(timingBarTitleElement, phaseName);
            timingBarTitleElement.setAttribute('role', 'switch');
            UI.ARIAUtils.setChecked(timingBarTitleElement, false);
            this.constructUpdateDetails(tableElement, tr, range);
            const barContainer = tr.createChild('td').createChild('div', 'service-worker-update-timing-row');
            const bar = (barContainer.createChild('span', 'service-worker-update-timing-bar ' + phaseName.toLowerCase()));
            bar.style.left = left + '%';
            bar.style.right = right + '%';
            bar.textContent = '\u200B'; // Important for 0-time items to have 0 width.
        }
    }
    /**
     * Detailed information about an update phase. Currently starting and ending time.
     */
    static constructUpdateDetails(tableElement, tr, range) {
        const detailsElement = tableElement.createChild('tr', 'service-worker-update-timing-bar-details');
        detailsElement.classList.add('service-worker-update-timing-bar-details-collapsed');
        self.onInvokeElement(tr, event => this.onToggleUpdateDetails(detailsElement, event));
        const detailsView = new UI.TreeOutline.TreeOutlineInShadow();
        detailsElement.appendChild(detailsView.element);
        const startTimeItem = document.createElementWithClass('div', 'service-worker-update-details-treeitem');
        const startTime = (new Date(range.start)).toISOString();
        startTimeItem.textContent = ls `Start time: ${startTime}`;
        const startTimeTreeElement = new UI.TreeOutline.TreeElement(startTimeItem);
        detailsView.appendChild(startTimeTreeElement);
        const endTimeItem = document.createElementWithClass('div', 'service-worker-update-details-treeitem');
        const endTime = (new Date(range.end)).toISOString();
        endTimeItem.textContent = ls `End time: ${endTime}`;
        const endTimeTreeElement = new UI.TreeOutline.TreeElement(endTimeItem);
        detailsView.appendChild(endTimeTreeElement);
    }
    static onToggleUpdateDetails(detailsRow, event) {
        if (!event.target) {
            return;
        }
        const target = (event.target);
        if (target.classList.contains('service-worker-update-timing-bar-clickable')) {
            detailsRow.classList.toggle('service-worker-update-timing-bar-details-collapsed');
            detailsRow.classList.toggle('service-worker-update-timing-bar-details-expanded');
            const expanded = target.getAttribute('aria-checked') === 'true';
            UI.ARIAUtils.setChecked(target, !expanded);
        }
    }
    static refresh(tableElement, registration) {
        const timeRanges = this.calculateServiceWorkerUpdateRanges(registration);
        this.updateTimingTable(tableElement, timeRanges);
    }
}
//# sourceMappingURL=ServiceWorkerUpdateCycleHelper.js.map