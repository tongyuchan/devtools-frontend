import*as RootModule from'../root/root.js';RootModule.Runtime.cachedResources.set("network/binaryResourceView.css","/*\n * Copyright 2019 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.panel.network .toolbar.binary-view-toolbar {\n  border-top: 1px solid var(--color-details-hairline);\n  border-bottom: 0;\n  padding-left: 5px;\n}\n\n.binary-view-copied-text {\n  opacity: 100%;\n}\n\n.binary-view-copied-text.fadeout {\n  opacity: 0%;\n  transition: opacity 1s;\n}\n\n/*# sourceURL=network/binaryResourceView.css */");RootModule.Runtime.cachedResources.set("network/blockedURLsPane.css","/*\n * Copyright (c) 2015 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.list {\n  border: none !important;\n  border-top: 1px solid var(--color-details-hairline) !important;\n}\n\n.blocking-disabled {\n  pointer-events: none;\n  opacity: 80%;\n}\n\n.editor-container {\n  padding: 0 4px;\n}\n\n.no-blocked-urls,\n.blocked-urls {\n  overflow-x: hidden;\n  overflow-y: auto;\n}\n\n.no-blocked-urls {\n  display: flex;\n  justify-content: center;\n  padding: 10px;\n}\n\n.no-blocked-urls > span {\n  white-space: pre;\n}\n\n.blocked-url {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  flex: auto;\n}\n\n.blocked-url-count {\n  flex: none;\n  padding-right: 9px;\n}\n\n.blocked-url-checkbox {\n  margin-left: 8px;\n  flex: none;\n}\n\n.blocked-url-checkbox:focus {\n  outline: auto 5px -webkit-focus-ring-color;\n}\n\n.blocked-url-label {\n  white-space: nowrap;\n  text-overflow: ellipsis;\n  overflow: hidden;\n  flex: auto;\n  padding: 0 3px;\n}\n\n.blocked-url-edit-row {\n  flex: none;\n  display: flex;\n  flex-direction: row;\n  margin: 7px 5px 0 5px;\n  align-items: center;\n}\n\n.blocked-url-edit-value {\n  user-select: none;\n  flex: 1 1 0;\n}\n\n.blocked-url-edit-row input {\n  width: 100%;\n  text-align: inherit;\n  height: 22px;\n}\n\n/*# sourceURL=network/blockedURLsPane.css */");RootModule.Runtime.cachedResources.set("network/eventSourceMessagesView.css","/*\n * Copyright (c) 2014 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.event-source-messages-view .data-grid {\n  flex: auto;\n  border: none;\n}\n\n/*# sourceURL=network/eventSourceMessagesView.css */");RootModule.Runtime.cachedResources.set("network/networkConfigView.css","/*\n * Copyright (c) 2015 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.network-config {\n  padding: 12px;\n  display: block;\n}\n\n.network-config-group {\n  display: flex;\n  margin-bottom: 10px;\n  flex-wrap: wrap;\n  flex: 0 0 auto;\n  min-height: 30px;\n}\n\n.network-config-title {\n  margin-right: 16px;\n  width: 130px;\n}\n\n.network-config-fields {\n  flex: 2 0 200px;\n}\n\n.panel-section-separator {\n  height: 1px;\n  margin-bottom: 10px;\n  background: #f0f0f0;\n}\n\n/* Disable cache */\n\n.network-config-disable-cache {\n  line-height: 28px;\n  border-top: none;\n  padding-top: 0;\n}\n\n.network-config-input-validation-error {\n  color: var(--input-validation-error);\n  margin: 5px 0;\n}\n\n.network-config-input-validation-error:empty {\n  display: none;\n}\n\n/* Network throttling */\n\n.network-config-throttling .chrome-select {\n  width: 100%;\n  max-width: 250px;\n}\n\n.network-config-throttling > .network-config-title {\n  line-height: 24px;\n}\n\n/* User agent */\n\n.network-config-ua > .network-config-title {\n  line-height: 20px;\n}\n\n.network-config-ua span[is=\"dt-radio\"].checked > * {\n  display: none;\n}\n\n.network-config-ua input {\n  display: block;\n  width: calc(100% - 20px);\n}\n\n.network-config-ua input[readonly] {\n  background-color: rgb(235 235 228);\n}\n\n.network-config-ua input[type=text],\n.network-config-ua .chrome-select {\n  margin-top: 8px;\n}\n\n.network-config-ua .chrome-select {\n  width: calc(100% - 20px);\n  max-width: 250px;\n}\n\n.network-config-ua span[is=\"dt-radio\"] {\n  display: block;\n}\n\n.network-config-ua-custom {\n  opacity: 50%;\n  padding-bottom: 8px;\n}\n\n.network-config-ua-custom.checked {\n  opacity: 100%;\n}\n\n/*# sourceURL=network/networkConfigView.css */");RootModule.Runtime.cachedResources.set("network/networkLogView.css","/*\n * Copyright (C) 2013 Google Inc. All rights reserved.\n *\n * Redistribution and use in source and binary forms, with or without\n * modification, are permitted provided that the following conditions are\n * met:\n *\n *     * Redistributions of source code must retain the above copyright\n * notice, this list of conditions and the following disclaimer.\n *     * Redistributions in binary form must reproduce the above\n * copyright notice, this list of conditions and the following disclaimer\n * in the documentation and/or other materials provided with the\n * distribution.\n *     * Neither the name of Google Inc. nor the names of its\n * contributors may be used to endorse or promote products derived from\n * this software without specific prior written permission.\n *\n * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS\n * \"AS IS\" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT\n * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR\n * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT\n * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,\n * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\n * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,\n * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\n * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\n * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n.network-log-grid.data-grid {\n  border: none !important;\n  flex: auto;\n}\n\n.network-log-grid.data-grid.no-selection:focus-visible {\n  border: none !important;\n}\n\n#network-container {\n  border: 1px solid rgb(204 204 204);\n  overflow: hidden;\n}\n\n#network-container.grid-focused.no-node-selected:focus-within {\n  border: 1px solid var(--accent-color);\n}\n\n.network-summary-bar {\n  flex: 0 0 27px;\n  line-height: 27px;\n  padding-left: 5px;\n  background-color: #eee;\n  border-top: 1px solid #ccc;\n  white-space: nowrap;\n  text-overflow: ellipsis;\n  overflow: hidden;\n  user-select: text;\n}\n\n.panel.network .toolbar.network-summary-bar {\n  border-bottom: 0;\n}\n\n.network-summary-bar span[is=dt-icon-label] {\n  margin-right: 6px;\n}\n\n.network-summary-bar > * {\n  flex: none;\n}\n\n.network-log-grid.data-grid table.data {\n  background: transparent;\n}\n\n.network-log-grid.data-grid td {\n  height: 41px;\n  border-left: 1px solid #e1e1e1;\n  vertical-align: middle;\n}\n\n.network-log-grid.data-grid .corner {\n  display: none;\n}\n\n.network-log-grid.data-grid.small td {\n  height: 21px;\n}\n\n.network-waterfall-header,\n.network-log-grid.data-grid th {\n  border-bottom: 1px solid rgb(205 205 205);\n  border-left: 1px solid rgb(205 205 205);\n}\n\n.network-log-grid.data-grid table.data th {\n  border-bottom: none;\n}\n\n.network-waterfall-header,\n.network-log-grid.data-grid .header-container {\n  height: 31px;\n  background-color: var(--toolbar-bg-color);\n}\n\n.network-log-grid.data-grid .data-container {\n  top: 31px;\n}\n\n.network-waterfall-header.small,\n.network-log-grid.data-grid.small .header-container {\n  height: 27px;\n}\n\n.network-log-grid.data-grid.small .data-container {\n  top: 27px;\n}\n\n.network-log-grid.data-grid select {\n  appearance: none;\n  border: none;\n  width: 100%;\n  color: inherit;\n}\n\n.network-log-grid.data-grid .name-column {\n  cursor: pointer;\n}\n\n.network-log-grid.data-grid .waterfall-column {\n  padding: 1px 0;\n}\n\n.network-log-grid.data-grid .waterfall-column .sort-order-icon-container {\n  right: 15px;\n  pointer-events: none;\n}\n\n.network-log-grid.data-grid th.sortable:active {\n  background-image: none !important;\n}\n\n.network-cell-subtitle {\n  font-weight: normal;\n  color: gray;\n}\n\n.network-badge {\n  margin-right: 4px;\n}\n\n/* We are using a multitude of different selector specificity rules here, which\n   is incompatible with what stylelint requires as ordering of the rules. */\n/* stylelint-disable no-descending-specificity */\n.network-error-row,\n.network-error-row .network-cell-subtitle,\n.network-log-grid.data-grid tr.selected.network-error-row,\n.network-log-grid.data-grid tr.selected.network-error-row .network-cell-subtitle,\n.network-log-grid.data-grid tr.selected.network-error-row .network-dim-cell,\n.network-log-grid.data-grid:focus tr.selected.network-error-row .devtools-link,\n.network-log-grid.data-grid:focus tr.selected.network-error-row,\n.network-log-grid.data-grid:focus tr.selected.network-error-row .network-cell-subtitle,\n.network-log-grid.data-grid:focus tr.selected.network-error-row .network-dim-cell {\n  color: rgb(230 0 0) !important;\n}\n\n.initiator-column .devtools-link {\n  color: inherit;\n}\n\n.network-log-grid.data-grid tr.selected,\n.network-log-grid.data-grid tr.selected .network-cell-subtitle,\n.network-log-grid.data-grid tr.selected .network-dim-cell {\n  color: inherit;\n}\n\n.network-log-grid.data-grid:focus tr.selected,\n.network-log-grid.data-grid:focus tr.selected .network-cell-subtitle,\n.network-log-grid.data-grid:focus tr.selected .network-dim-cell {\n  color: var(--selection-fg-color);\n}\n\n.network-header-subtitle {\n  color: gray;\n}\n\n.network-log-grid.data-grid.small .network-cell-subtitle,\n.network-log-grid.data-grid.small .network-header-subtitle {\n  display: none;\n}\n\n.network-log-grid.data-grid.small tr.selected .network-cell-subtitle-show-inline-when-selected {\n  display: inline;\n  margin-left: 4px;\n}\n\n.network-log-grid tr.highlighted-row {\n  animation: network-row-highlight-fadeout 2s 0s;\n}\n\n/* See comment above why the rules were disabled */\n/* stylelint-enable no-descending-specificity */\n\n@keyframes network-row-highlight-fadeout {\n  from { background-color: rgb(255 255 120 / 100%); }\n  to { background-color: rgb(255 255 120 / 0%); }\n}\n\n/* Resource preview icons */\n\n/* These rules are grouped by type and therefore do not adhere to the ordering of stylelint */\n/* stylelint-disable no-descending-specificity, no-duplicate-selectors */\n\n.network-log-grid.data-grid .icon {\n  content: url(Images/resourcePlainIcon.png);\n}\n\n.network-log-grid.data-grid.small .icon {\n  content: url(Images/resourcePlainIconSmall.png);\n}\n\n.network-log-grid.data-grid .icon.script {\n  content: url(Images/resourceJSIcon.png);\n}\n\n.network-log-grid.data-grid.small .icon.script {\n  content: url(Images/resourceDocumentIconSmall.png);\n}\n\n.network-log-grid.data-grid .icon.document {\n  content: url(Images/resourceDocumentIcon.png);\n}\n\n.network-log-grid.data-grid.small .icon.document {\n  content: url(Images/resourceDocumentIconSmall.png);\n}\n\n.network-log-grid.data-grid .icon.stylesheet {\n  content: url(Images/resourceCSSIcon.png);\n}\n\n.network-log-grid.data-grid.small .icon.stylesheet {\n  content: url(Images/resourceDocumentIconSmall.png);\n}\n\n.network-log-grid.data-grid .icon.media {\n  content: url(Images/resourcePlainIcon.png); /* FIXME: media icon */\n}\n\n.network-log-grid.data-grid.small .icon.media {\n  content: url(Images/resourcePlainIconSmall.png); /* FIXME: media icon */\n}\n\n.network-log-grid.data-grid .icon.texttrack {\n  content: url(Images/resourcePlainIcon.png); /* FIXME: vtt icon */\n}\n\n.network-log-grid.data-grid.small .icon.texttrack {\n  content: url(Images/resourcePlainIconSmall.png); /* FIXME: vtt icon */\n}\n\n.network-log-grid.data-grid .icon.image {\n  position: relative;\n  background-image: url(Images/resourcePlainIcon.png);\n  background-repeat: no-repeat;\n  content: \"\";\n}\n\n.network-log-grid.data-grid.small .icon.image {\n  background-image: url(Images/resourcePlainIconSmall.png);\n  content: \"\";\n}\n\n.network-log-grid.data-grid .icon {\n  float: left;\n  width: 32px;\n  height: 32px;\n  margin-top: 1px;\n  margin-right: 3px;\n}\n\n.network-log-grid.data-grid.small .icon {\n  width: 16px;\n  height: 16px;\n}\n\n.network-log-grid.data-grid .image-network-icon-preview {\n  position: absolute;\n  margin: auto;\n  top: 3px;\n  bottom: 4px;\n  left: 5px;\n  right: 5px;\n  max-width: 18px;\n  max-height: 21px;\n  min-width: 1px;\n  min-height: 1px;\n}\n\n.network-log-grid.data-grid.small .image-network-icon-preview {\n  top: 2px;\n  bottom: 1px;\n  left: 3px;\n  right: 3px;\n  max-width: 8px;\n  max-height: 11px;\n}\n\n.network-log-grid.data-grid .trailing-link-icon {\n  padding-left: 0.5ex;\n}\n\n/* stylelint-enable no-descending-specificity, no-duplicate-selectors */\n\n/* This is part of the large color block declared above, but should not be\n   extracted out. */\n/* stylelint-disable-next-line no-descending-specificity */\n.network-dim-cell {\n  color: grey;\n}\n\n.network-frame-divider {\n  width: 2px;\n  background-color: #fccc49;\n  z-index: 10;\n  visibility: hidden;\n}\n\n#network-container:not(.brief-mode) .data-container {\n  overflow: hidden;\n}\n\n.network-log-grid.data-grid .resources-dividers {\n  z-index: 0;\n}\n\n.network-log-grid.data-grid .resources-dividers-label-bar {\n  background-color: transparent;\n  border: none;\n  height: 30px;\n  pointer-events: none;\n}\n\n.network-log-grid.data-grid span.separator-in-cell {\n  user-select: none;\n  min-width: 1ex;\n  display: inline-block;\n}\n\n.network-status-pane {\n  color: #777;\n  background-color: var(--color-background);\n  z-index: 500;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  text-align: center;\n  padding: 0 20px;\n  overflow: auto;\n}\n\n.network-status-pane > .recording-hint {\n  font-size: 14px;\n  text-align: center;\n  line-height: 28px;\n}\n\n.network-waterfall-header {\n  position: absolute;\n  border-left: 0;\n  width: 100%;\n  display: table;\n  z-index: 200;\n}\n\n.network-waterfall-header:hover {\n  background-color: hsl(0deg 0% 10% / 10%);\n}\n\n.network-waterfall-header div {\n  display: table-cell;\n  line-height: 14px;\n  margin: auto 0;\n  vertical-align: middle;\n  text-align: left;\n  font-weight: normal;\n  padding: 0 4px;\n}\n\n/* All network-waterfall-header rules are defined here instead of above */\n/* stylelint-disable-next-line no-descending-specificity */\n.network-waterfall-header .sort-order-icon-container {\n  position: absolute;\n  top: 1px;\n  right: 0;\n  bottom: 1px;\n  display: flex;\n  align-items: center;\n}\n\n.network-waterfall-header .sort-order-icon {\n  align-items: center;\n  margin-right: 4px;\n  margin-bottom: -2px;\n}\n\n.network-frame-group-icon {\n  display: inline-block;\n  margin: -8px -2px;\n}\n\n.network-frame-group-badge {\n  margin-right: 4px;\n}\n\n@media (forced-colors: active) {\n  .network-status-pane > .recording-hint {\n    color: canvastext;\n  }\n\n  /* This is part of the large color block declared above, but should not be\n   extracted out. */\n  /* stylelint-disable no-descending-specificity */\n  .network-log-grid.data-grid table.data tr.revealed.selected,\n  .network-log-grid.data-grid:focus table.data tr.revealed.selected,\n  .network-log-grid.data-grid:focus tr.selected .network-dim-cell,\n  .network-log-grid.data-grid tr.selected .network-dim-cell,\n  .network-log-grid.data-grid:focus tr.selected .initiator-column .devtools-link,\n  .network-log-grid.data-grid tr.selected .initiator-column .devtools-link,\n  .network-waterfall-header:hover * {\n    color: HighlightText;\n  }\n  /* stylelint-enable no-descending-specificity */\n\n  .network-log-grid {\n    --network-grid-default-color: canvas;\n    --network-grid-stripe-color: canvas;\n    --network-grid-hovered-color: Highlight;\n    --network-grid-selected-color: ButtonText;\n    --network-grid-focus-selected-color: Highlight;\n  }\n\n  #network-container.no-node-selected:focus-within,\n  .network-status-pane {\n    forced-color-adjust: none;\n    border-color: Highlight;\n    background-color: canvas !important;\n  }\n\n  .network-waterfall-header:hover {\n    forced-color-adjust: none;\n    background-color: Highlight;\n  }\n\n  .network-waterfall-header.small,\n  .network-log-grid.data-grid.small .header-container .network-waterfall-header,\n  .network-log-grid.data-grid .header-container {\n    background-color: canvas;\n  }\n\n  .network-waterfall-header:hover .sort-order-icon-container [is=ui-icon].icon-mask {\n    background-color: HighlightText;\n  }\n}\n\n/*# sourceURL=network/networkLogView.css */");RootModule.Runtime.cachedResources.set("network/networkManageCustomHeadersView.css","/*\n * Copyright 2016 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.custom-headers-list {\n  height: 272px;\n  width: 250px;\n}\n\n.custom-headers-wrapper {\n  margin: 10px;\n}\n\n.header {\n  padding: 0 0 6px;\n  font-size: 18px;\n  font-weight: normal;\n  flex: none;\n}\n\n.custom-headers-header {\n  padding: 2px;\n}\n\n.custom-headers-list-item {\n  padding-left: 5px;\n}\n\n.editor-container {\n  padding: 5px 0 0 5px;\n}\n\n.add-button {\n  width: 150px;\n  margin: auto;\n  margin-top: 5px;\n}\n\n/*# sourceURL=network/networkManageCustomHeadersView.css */");RootModule.Runtime.cachedResources.set("network/networkPanel.css","/*\n * Copyright (C) 2006, 2007, 2008 Apple Inc.  All rights reserved.\n * Copyright (C) 2009 Anthony Ricaud <rik@webkit.org>\n *\n * Redistribution and use in source and binary forms, with or without\n * modification, are permitted provided that the following conditions\n * are met:\n *\n * 1.  Redistributions of source code must retain the above copyright\n *     notice, this list of conditions and the following disclaimer.\n * 2.  Redistributions in binary form must reproduce the above copyright\n *     notice, this list of conditions and the following disclaimer in the\n *     documentation and/or other materials provided with the distribution.\n * 3.  Neither the name of Apple Computer, Inc. (\"Apple\") nor the names of\n *     its contributors may be used to endorse or promote products derived\n *     from this software without specific prior written permission.\n *\n * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS \"AS IS\" AND ANY\n * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED\n * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE\n * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY\n * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES\n * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;\n * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND\n * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF\n * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n.network-details-view {\n  background: rgb(203 203 203);\n}\n\n.network-details-view-tall-header {\n  border-top: 4px solid var(--toolbar-bg-color);\n}\n\n.network-item-view {\n  display: flex;\n  background: var(--color-background);\n}\n\n.network-item-preview-toolbar {\n  border-top: 1px solid #ccc;\n  background-color: #eee;\n}\n\n.resource-timing-view {\n  display: block;\n  margin: 6px;\n  color: rgb(30% 30% 30%);\n  overflow: auto;\n}\n\n.resource-timing-table {\n  width: 100% !important;\n}\n\n#network-overview-panel {\n  flex: none;\n  position: relative;\n}\n\n#network-overview-container {\n  overflow: hidden;\n  flex: auto;\n  display: flex;\n  flex-direction: column;\n  position: relative;\n  border-bottom: 1px solid #cdcdcd;\n}\n\n#network-overview-container canvas {\n  width: 100%;\n  height: 100%;\n}\n\n.network-overview .resources-dividers-label-bar {\n  background-color: rgb(255 255 255 / 95%);\n}\n\n#network-overview-grid .resources-dividers-label-bar {\n  pointer-events: auto;\n}\n\n.network .network-overview {\n  flex: 0 0 60px;\n}\n\n.network-overview .resources-dividers-label-bar .resources-divider {\n  background-color: transparent;\n}\n\n.network-overview .resources-dividers {\n  z-index: 250;\n}\n\n.request-view.html iframe {\n  width: 100%;\n  height: 100%;\n  position: absolute;\n}\n\n.network-film-strip {\n  border-bottom: solid 1px #cdcdcd;\n  flex: none !important;\n}\n\n.network-film-strip-placeholder {\n  flex-shrink: 0;\n}\n\n.network-tabbed-pane {\n  background-color: var(--toolbar-bg-color);\n}\n\n.network-settings-pane {\n  flex: none;\n  background-color: var(--toolbar-bg-color);\n}\n\n.network-settings-pane .toolbar {\n  flex: 1 1;\n}\n\n.network-toolbar-container {\n  display: flex;\n  flex: none;\n}\n\n.network-toolbar-container > :first-child {\n  flex: 1 1 auto;\n}\n\n.panel.network .toolbar {\n  background-color: var(--toolbar-bg-color);\n  border-bottom: var(--divider-border);\n}\n\n@media (forced-colors: active) {\n  .panel.network .toolbar {\n    background-color: canvas;\n  }\n}\n\n/*# sourceURL=network/networkPanel.css */");RootModule.Runtime.cachedResources.set("network/networkTimingTable.css","/*\n * Copyright 2017 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.network-timing-table {\n  width: 380px;\n  border-spacing: 0;\n  padding-left: 10px;\n  padding-right: 10px;\n  line-height: initial;\n  table-layout: fixed;\n}\n\n.network-timing-start {\n  border-top: 5px solid transparent;\n}\n\n.network-timing-start th span.network-timing-hidden-header {\n  height: 1px;\n  width: 1px;\n  position: absolute;\n  overflow: hidden;\n}\n\n.network-timing-table-header td,\n.network-timing-footer td {\n  border-top: 10px solid transparent;\n}\n\n.network-timing-table-header td {\n  color: #737373;\n}\n\n.network-timing-table td {\n  padding: 4px 0;\n}\n\n.network-timing-table-header td:last-child {\n  text-align: right;\n}\n\n.network-timing-footer td:last-child {\n  font-weight: bold;\n  text-align: right;\n}\n\ntable.network-timing-table > tr:not(.network-timing-table-header):not(.network-timing-footer) > td:first-child {\n  padding-left: 12px;\n}\n\n.network-timing-table col.labels {\n  width: 156px;\n}\n\n.network-timing-table col.duration {\n  width: 80px;\n}\n\n.network-timing-table td.caution {\n  font-weight: bold;\n  color: rgb(255 128 0);\n  padding: 2px 0;\n}\n\n.network-timing-table hr.break {\n  border: 0;\n  height: 1px;\n  background-image: linear-gradient(to right, #eee, #bbb, #eee);\n}\n\n.network-timing-row {\n  position: relative;\n  height: 15px;\n}\n\n.network-timing-bar {\n  position: absolute;\n  min-width: 1px;\n  top: 0;\n  bottom: 0;\n}\n\n.network-timing-bar-title {\n  color: #222;\n  white-space: nowrap;\n  text-align: right;\n}\n\n.network-timing-bar.queueing,\n.network-timing-bar.total {\n  border: 1px solid rgb(0 0 0 / 10%);\n}\n\n.network-timing-bar.blocking,\n.-theme-preserve {\n  background-color: #aaa;\n}\n\n.network-timing-bar.proxy,\n.-theme-preserve {\n  background-color: #a1887f;\n}\n\n.network-timing-bar.dns,\n.-theme-preserve {\n  background-color: #009688;\n}\n\n.network-timing-bar.connecting,\n.network-timing-bar.serviceworker,\n.network-timing-bar.serviceworker-preparation,\n.-theme-preserve {\n  background-color: #ff9800;\n}\n\n.network-timing-bar.ssl,\n.-theme-preserve {\n  background-color: #9c27b0;\n}\n\n.network-timing-bar.serviceworker-respondwith,\n.-theme-preserve {\n  background-color: #a8a3ff;\n}\n\n.network-fetch-timing-bar-clickable::before {\n  user-select: none;\n  -webkit-mask-image: url(Images/treeoutlineTriangles.svg);\n  -webkit-mask-position: 0 0;\n  -webkit-mask-size: 32px 24px;\n  float: left;\n  width: 8px;\n  height: 12px;\n  margin-right: 2px;\n  content: \"\";\n  position: relative;\n  top: 3px;\n  background-color: rgb(110 110 110);\n}\n\n.network-fetch-timing-bar-clickable {\n  position: relative;\n  left: -12px;\n}\n\n.network-fetch-timing-bar-clickable:focus-visible {\n  background-color: var(--toolbar-bg-color);\n}\n\n.network-fetch-timing-bar-clickable[aria-checked=\"true\"]::before {\n  -webkit-mask-position: -16px 0;\n}\n\n.network-fetch-timing-bar-details-collapsed {\n  display: none;\n}\n\n.network-fetch-timing-bar-details-expanded {\n  display: block;\n}\n\n.network-fetch-timing-bar-details {\n  padding-left: 11px;\n  width: fit-content;\n}\n\n.network-fetch-details-treeitem {\n  width: max-content;\n}\n\n.network-timing-bar.sending,\n.-theme-preserve {\n  background-color: #b0bec5;\n}\n\n.network-timing-bar.waiting,\n.-theme-preserve {\n  background-color: #00c853;\n}\n\n.network-timing-bar.receiving,\n.network-timing-bar.receiving-push,\n.-theme-preserve {\n  background-color: #03a9f4;\n}\n\n.network-timing-bar.push,\n.-theme-preserve {\n  background-color: #8cdbff;\n}\n\n.network-timing-bar.server-timing,\n.-theme-preserve {\n  background-color: #ddd;\n}\n\n.network-timing-table td.network-timing-metric {\n  white-space: nowrap;\n  max-width: 150px;\n  overflow-x: hidden;\n  text-overflow: ellipsis;\n}\n\n.network-timing-bar.proxy,\n.network-timing-bar.dns,\n.network-timing-bar.ssl,\n.network-timing-bar.connecting,\n.network-timing-bar.blocking {\n  height: 10px;\n  margin: auto;\n}\n\n@media (forced-colors: active) {\n  .network-timing-bar.blocking,\n  .network-timing-bar.proxy,\n  .network-timing-bar.dns,\n  .network-timing-bar.connecting,\n  .network-timing-bar.serviceworker,\n  .network-timing-bar.serviceworker-preparation,\n  .network-timing-bar.ssl,\n  .network-timing-bar.sending,\n  .network-timing-bar.waiting,\n  .network-timing-bar.receiving,\n  .network-timing-bar.receiving-push,\n  .network-timing-bar.push,\n  .network-timing-bar.server-timing,\n  .-theme-preserve {\n    forced-color-adjust: none;\n  }\n\n  .network-timing-table-header td,\n  .network-timing-footer td {\n    forced-color-adjust: none;\n    color: ButtonText;\n  }\n}\n\n/*# sourceURL=network/networkTimingTable.css */");RootModule.Runtime.cachedResources.set("network/networkWaterfallColumn.css","/* Copyright 2016 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.network-waterfall-v-scroll {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  overflow-x: hidden;\n  margin-top: 31px;\n  z-index: 200;\n}\n\n.network-waterfall-v-scroll.small {\n  margin-top: 27px;\n}\n\n.network-waterfall-v-scroll-content {\n  width: 15px;\n  pointer-events: none;\n}\n\n/*# sourceURL=network/networkWaterfallColumn.css */");RootModule.Runtime.cachedResources.set("network/requestCookiesView.css","/*\n * Copyright (c) 2014 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.request-cookies-view {\n  overflow: auto;\n  padding: 12px;\n  height: 100%;\n}\n\n.request-cookies-view .request-cookies-title {\n  font-size: 12px;\n  font-weight: bold;\n  margin-right: 30px;\n  color: rgb(97 97 97);\n}\n\n.request-cookies-view .cookie-line {\n  margin-top: 6px;\n  display: inline-block;\n}\n\n.request-cookies-view .cookies-panel-item {\n  margin-top: 6px;\n  margin-bottom: 16px;\n  flex: none;\n}\n\n@media (forced-colors: active) {\n  td.flagged-cookie-attribute-cell .cookie-warning-icon {\n    forced-color-adjust: none;\n    filter: grayscale();\n  }\n}\n\n/*# sourceURL=network/requestCookiesView.css */");RootModule.Runtime.cachedResources.set("network/requestHeadersTree.css","/*\n * Copyright 2016 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.tree-outline {\n  padding-left: 0;\n\n  --error-background-color: #d93025;\n}\n\n.tree-outline > ol {\n  padding-bottom: 5px;\n  border-bottom: solid 1px #e0e0e0;\n}\n\n.tree-outline > .parent {\n  user-select: none;\n  font-weight: bold;\n  color: #616161;\n  margin-top: -1px;\n  display: flex;\n  align-items: center;\n  height: 26px;\n}\n\n.tree-outline li {\n  display: block;\n  padding-left: 5px;\n  line-height: 20px;\n}\n\n.tree-outline li:not(.parent) {\n  margin-left: 10px;\n}\n\n.tree-outline li:not(.parent)::before {\n  display: none;\n}\n\n.tree-outline .caution {\n  margin-left: 4px;\n  display: inline-block;\n  font-weight: bold;\n}\n\n.tree-outline li.expanded .header-count {\n  display: none;\n}\n\n.tree-outline li .header-toggle {\n  display: none;\n}\n\n.tree-outline li .status-from-cache {\n  color: gray;\n}\n\n.tree-outline li.expanded .header-toggle {\n  display: inline;\n  margin-left: 30px;\n  font-weight: normal;\n  color: rgb(45% 45% 45%);\n}\n\n.tree-outline li .header-toggle:hover {\n  color: rgb(20% 20% 45%);\n  cursor: pointer;\n}\n\n.tree-outline .header-name {\n  color: rgb(33% 33% 33%);\n  display: inline-block;\n  margin-right: 0.25em;\n  font-weight: bold;\n  vertical-align: top;\n  white-space: pre-wrap;\n}\n\n.tree-outline .header-separator {\n  user-select: none;\n}\n\n.tree-outline .header-badge-text {\n  font-variant: small-caps;\n  font-weight: 500;\n  white-space: pre-wrap;\n  word-break: break-all;\n}\n\n.tree-outline .header-warning {\n  color: var(--error-background-color);\n}\n\n.tree-outline .header-badge {\n  display: inline;\n  margin-right: 0.75em;\n  background-color: var(--error-background-color);\n  color: white;\n  border-radius: 100vh;\n  padding-left: 6px;\n  padding-right: 6px;\n}\n\n.tree-outline .header-value {\n  display: inline;\n  margin-right: 1em;\n  white-space: pre-wrap;\n  word-break: break-all;\n  margin-top: 1px;\n}\n\n.tree-outline .call-to-action {\n  background-color: #f8f9fa;\n  padding: 8px;\n  border-radius: 2px;\n}\n\n.tree-outline .selected .call-to-action {\n  background-color: transparent;\n  padding: 8px;\n  border-radius: 2px;\n}\n\n.tree-outline .call-to-action-body {\n  padding: 6px 0;\n  margin-left: 9.5px;\n  border-left: 2px solid #f29900;\n  padding-left: 18px;\n}\n\n.tree-outline .call-to-action .explanation {\n  font-weight: bold;\n}\n\n.tree-outline .call-to-action code {\n  font-size: 90%;\n}\n\n.tree-outline .call-to-action .example .comment::before {\n  content: \" — \";\n}\n\n.tree-outline .empty-request-header {\n  color: rgb(33% 33% 33% / 50%);\n}\n\n.request-headers-show-more-button {\n  border: none;\n  border-radius: 3px;\n  display: inline-block;\n  font-size: 12px;\n  font-family: sans-serif;\n  cursor: pointer;\n  margin: 0 4px;\n  padding: 2px 4px;\n}\n\n.header-highlight {\n  background-color: #ffff78;\n}\n\n.x-client-data-details {\n  padding-left: 10px;\n}\n\n@media (forced-colors: active) {\n  :host-context(.request-headers-tree) ol.tree-outline:not(.hide-selection-when-blurred) li.selected:focus {\n    background: Highlight;\n  }\n\n  :host-context(.request-headers-tree) ol.tree-outline:not(.hide-selection-when-blurred) li::before {\n    background-color: ButtonText;\n  }\n\n  :host-context(.request-headers-tree) ol.tree-outline:not(.hide-selection-when-blurred) li.selected.parent::before {\n    background-color: HighlightText;\n  }\n\n  :host-context(.request-headers-tree) ol.tree-outline:not(.hide-selection-when-blurred) li.selected *,\n  :host-context(.request-headers-tree) ol.tree-outline:not(.hide-selection-when-blurred) li.selected.parent,\n  :host-context(.request-headers-tree) ol.tree-outline:not(.hide-selection-when-blurred) li.selected.parent span,\n  :host-context(.request-headers-tree) ol.tree-outline:not(.hide-selection-when-blurred) li.selected:focus .status-from-cache {\n    color: HighlightText;\n  }\n}\n\n/*# sourceURL=network/requestHeadersTree.css */");RootModule.Runtime.cachedResources.set("network/requestHeadersView.css","/*\n * Copyright (c) 2014 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.request-headers-view {\n  user-select: text;\n  overflow: auto;\n}\n\n.resource-status-image {\n  margin-top: -2px;\n  margin-right: 3px;\n}\n\n.request-headers-tree {\n  flex-grow: 1;\n  overflow-y: auto;\n  margin: 0;\n}\n\n.header-decode-error {\n  color: red;\n}\n\n.-theme-with-dark-background .header-decode-error {\n  color: hsl(0deg 100% 65%);\n}\n\n/*# sourceURL=network/requestHeadersView.css */");RootModule.Runtime.cachedResources.set("network/requestHTMLView.css","/*\n * Copyright (c) 2018 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.html-preview-frame {\n  box-shadow: var(--drop-shadow);\n\n  /* We always want a white background, even in dark mode, hence why we don't\n  use our theme variables for this one */\n  background: var(--color-background);\n  flex-grow: 1;\n  margin: 20px;\n}\n\n/*# sourceURL=network/requestHTMLView.css */");RootModule.Runtime.cachedResources.set("network/requestInitiatorView.css","/*\n * Copyright (c) 2019 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.request-initiator-view {\n  display: block;\n  margin: 6px;\n}\n\n.request-initiator-view-section-title {\n  font-weight: bold;\n  padding: 4px;\n}\n\n.request-initiator-view-section-title:focus-visible {\n  background-color: var(--color-background-elevation-2);\n}\n\n.request-initiator-view-section-content {\n  margin-left: 6px;\n}\n\n@media (forced-colors: active) {\n  .request-initiator-view-section-title:focus-visible [is=ui-icon].icon-mask {\n    background-color: HighlightText;\n  }\n\n  .request-initiator-view-section-title:focus-visible {\n    forced-color-adjust: none;\n    background-color: Highlight;\n    color: HighlightText;\n  }\n}\n\n/*# sourceURL=network/requestInitiatorView.css */");RootModule.Runtime.cachedResources.set("network/signedExchangeInfoTree.css","/*\n * Copyright 2018 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.tree-outline {\n  padding-left: 0;\n}\n\n.tree-outline > ol {\n  padding-bottom: 5px;\n  border-bottom: solid 1px #e0e0e0;\n}\n\n.tree-outline > .parent {\n  user-select: none;\n  font-weight: bold;\n  color: #616161;\n  margin-top: -1px;\n  display: flex;\n  align-items: center;\n  height: 26px;\n}\n\n.tree-outline li {\n  padding-left: 5px;\n  line-height: 20px;\n}\n\n.tree-outline li:not(.parent) {\n  display: block;\n  margin-left: 10px;\n}\n\n.tree-outline li:not(.parent)::before {\n  display: none;\n}\n\n.tree-outline .header-name {\n  color: rgb(33% 33% 33%);\n  display: inline-block;\n  margin-right: 0.25em;\n  font-weight: bold;\n  vertical-align: top;\n  white-space: pre-wrap;\n}\n\n.tree-outline .header-separator {\n  user-select: none;\n}\n\n.tree-outline .header-value {\n  display: inline;\n  margin-right: 1em;\n  white-space: pre-wrap;\n  word-break: break-all;\n  margin-top: 1px;\n}\n\n.tree-outline .header-toggle {\n  display: inline;\n  margin-left: 30px;\n  font-weight: normal;\n  color: rgb(45% 45% 45%);\n}\n\n.tree-outline .header-toggle:hover {\n  color: rgb(20% 20% 45%);\n  cursor: pointer;\n}\n\n.tree-outline .error-log {\n  color: red;\n  display: inline-block;\n  margin-right: 0.25em;\n  margin-left: 0.25em;\n  font-weight: bold;\n  vertical-align: top;\n  white-space: pre-wrap;\n}\n\n.tree-outline .hex-data {\n  display: block;\n  word-break: break-word;\n  margin-left: 20px;\n}\n\n.tree-outline .error-field {\n  color: red;\n}\n\n/*# sourceURL=network/signedExchangeInfoTree.css */");RootModule.Runtime.cachedResources.set("network/signedExchangeInfoView.css","/*\n * Copyright (c) 2018 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.signed-exchange-info-view {\n  user-select: text;\n  overflow: auto;\n}\n\n.signed-exchange-info-tree {\n  flex-grow: 1;\n  overflow-y: auto;\n  margin: 0;\n}\n\n/*# sourceURL=network/signedExchangeInfoView.css */");RootModule.Runtime.cachedResources.set("network/webSocketFrameView.css","/*\n * Copyright (c) 2014 The Chromium Authors. All rights reserved.\n * Use of this source code is governed by a BSD-style license that can be\n * found in the LICENSE file.\n */\n\n.websocket-frame-view {\n  user-select: text;\n}\n\n.websocket-frame-view .data-grid {\n  flex: auto;\n  border: none;\n}\n\n.websocket-frame-view .data-grid .data {\n  background-image: none;\n}\n\n.websocket-frame-view-td {\n  border-bottom: 1px solid #ccc;\n}\n\n.websocket-frame-view .data-grid tr.selected {\n  background-color: #def;\n}\n\n.websocket-frame-view .data-grid td,\n.websocket-frame-view .data-grid th {\n  border-left-color: #ccc;\n}\n\n.websocket-frame-view-row-send td:first-child::before {\n  content: \"\\2B06\";\n  color: #080;\n  padding-right: 4px;\n}\n\n.websocket-frame-view-row-receive td:first-child::before {\n  content: \"\\2B07\";\n  color: #e65100;\n  padding-right: 4px;\n}\n\n.data-grid:focus .websocket-frame-view-row-send.selected td:first-child::before,\n.data-grid:focus .websocket-frame-view-row-receive.selected td:first-child::before {\n  color: white;\n}\n\n.websocket-frame-view-row-send {\n  background-color: rgb(226 247 218);\n}\n\n.websocket-frame-view-row-error {\n  background-color: rgb(255 237 237);\n  color: rgb(182 0 0);\n}\n\n.websocket-frame-view .toolbar {\n  border-bottom: var(--divider-border);\n}\n\n/*# sourceURL=network/webSocketFrameView.css */");