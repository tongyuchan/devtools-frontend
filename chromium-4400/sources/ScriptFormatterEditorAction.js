// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../common/common.js';
import * as FormatterModule from '../formatter/formatter.js';
import * as Persistence from '../persistence/persistence.js';
import * as SourceFrame from '../source_frame/source_frame.js';
import * as UI from '../ui/ui.js';
import * as Workspace from '../workspace/workspace.js';
import { Events } from './SourcesView.js'; // eslint-disable-line no-unused-vars
/**
 * @implements {EditorAction}
 */
export class ScriptFormatterEditorAction {
    constructor() {
        /** @type {!Set<string>} */
        this._pathsToFormatOnLoad = new Set();
        /** @type {!SourcesView} */
        this._sourcesView;
        /** @type {!UI.Toolbar.ToolbarButton} */
        this._button;
    }
    /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
    _editorSelected(event) {
        const uiSourceCode = /** @type {!Workspace.UISourceCode.UISourceCode} */ (event.data);
        this._updateButton(uiSourceCode);
        if (this._isFormatableScript(uiSourceCode) && this._pathsToFormatOnLoad.has(uiSourceCode.url()) &&
            !FormatterModule.SourceFormatter.SourceFormatter.instance().hasFormatted(uiSourceCode)) {
            this._showFormatted(uiSourceCode);
        }
    }
    /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
    async _editorClosed(event) {
        const uiSourceCode = /** @type {!Workspace.UISourceCode.UISourceCode} */ (event.data.uiSourceCode);
        const wasSelected = /** @type {boolean} */ (event.data.wasSelected);
        if (wasSelected) {
            this._updateButton(null);
        }
        const original = await FormatterModule.SourceFormatter.SourceFormatter.instance().discardFormattedUISourceCode(uiSourceCode);
        if (original) {
            this._pathsToFormatOnLoad.delete(original.url());
        }
    }
    /**
     * @param {?Workspace.UISourceCode.UISourceCode} uiSourceCode
     */
    _updateButton(uiSourceCode) {
        const isFormattable = this._isFormatableScript(uiSourceCode);
        this._button.element.classList.toggle('hidden', !isFormattable);
        if (uiSourceCode) {
            // We always update the title of the button, even if the {uiSourceCode} is
            // not formattable, since we use the title (the aria-label actually) as a
            // signal for the E2E tests that the source code loading is done.
            this._button.setTitle(Common.UIString.UIString(`Pretty print ${uiSourceCode.name()}`));
        }
    }
    /**
     * @override
     * @param {!SourcesView} sourcesView
     * @return {!UI.Toolbar.ToolbarButton}
     */
    button(sourcesView) {
        if (this._button) {
            return this._button;
        }
        this._sourcesView = sourcesView;
        this._sourcesView.addEventListener(Events.EditorSelected, event => {
            this._editorSelected(event);
        });
        this._sourcesView.addEventListener(Events.EditorClosed, event => {
            this._editorClosed(event);
        });
        this._button = new UI.Toolbar.ToolbarButton(Common.UIString.UIString('Pretty print'), 'largeicon-pretty-print');
        this._button.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, this._onFormatScriptButtonClicked, this);
        this._updateButton(sourcesView.currentUISourceCode());
        return this._button;
    }
    /**
     * @param {?Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @return {boolean}
     */
    _isFormatableScript(uiSourceCode) {
        if (!uiSourceCode) {
            return false;
        }
        if (uiSourceCode.project().canSetFileContent()) {
            return false;
        }
        if (uiSourceCode.project().type() === Workspace.Workspace.projectTypes.Formatter) {
            return false;
        }
        if (Persistence.Persistence.PersistenceImpl.instance().binding(uiSourceCode)) {
            return false;
        }
        if (uiSourceCode.mimeType() === 'application/wasm') {
            return false;
        }
        return uiSourceCode.contentType().hasScripts();
    }
    isCurrentUISourceCodeFormatable() {
        const uiSourceCode = this._sourcesView.currentUISourceCode();
        return this._isFormatableScript(uiSourceCode);
    }
    /**
     * @param {!Common.EventTarget.EventTargetEvent} event
     */
    _onFormatScriptButtonClicked(event) {
        this.toggleFormatScriptSource();
    }
    toggleFormatScriptSource() {
        const uiSourceCode = this._sourcesView.currentUISourceCode();
        if (!uiSourceCode || !this._isFormatableScript(uiSourceCode)) {
            return;
        }
        this._pathsToFormatOnLoad.add(uiSourceCode.url());
        this._showFormatted(uiSourceCode);
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     */
    async _showFormatted(uiSourceCode) {
        const formatData = await FormatterModule.SourceFormatter.SourceFormatter.instance().format(uiSourceCode);
        if (uiSourceCode !== this._sourcesView.currentUISourceCode()) {
            return;
        }
        const sourceFrame = this._sourcesView.viewForFile(uiSourceCode);
        let start = [0, 0];
        if (sourceFrame instanceof SourceFrame.SourceFrame.SourceFrameImpl) {
            const selection = sourceFrame.selection();
            start = formatData.mapping.originalToFormatted(selection.startLine, selection.startColumn);
        }
        this._sourcesView.showSourceLocation(formatData.formattedSourceCode, start[0], start[1]);
    }
}
//# sourceMappingURL=ScriptFormatterEditorAction.js.map