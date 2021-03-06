// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Bindings from '../bindings/bindings.js';
import * as Components from '../components/components.js';
import * as UI from '../ui/ui.js';
import { Plugin } from './Plugin.js';
export class ScriptOriginPlugin extends Plugin {
    /**
     * @param {!SourceFrame.SourcesTextEditor.SourcesTextEditor} textEditor
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     */
    constructor(textEditor, uiSourceCode) {
        super();
        this._textEditor = textEditor;
        this._uiSourceCode = uiSourceCode;
    }
    /**
     * @override
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @return {boolean}
     */
    static accepts(uiSourceCode) {
        return uiSourceCode.contentType().hasScripts() || Boolean(ScriptOriginPlugin._script(uiSourceCode));
    }
    /**
     * @override
     * @return {!Promise<!Array<!UI.Toolbar.ToolbarItem>>}
     */
    async rightToolbarItems() {
        const originURL = Bindings.CompilerScriptMapping.CompilerScriptMapping.uiSourceCodeOrigin(this._uiSourceCode);
        if (originURL) {
            const item = UI.UIUtils.formatLocalized('(source mapped from %s)', [Components.Linkifier.Linkifier.linkifyURL(originURL)]);
            return [new UI.Toolbar.ToolbarItem(item)];
        }
        const pluginManager = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().pluginManager;
        if (pluginManager) {
            for (const originScript of pluginManager.scriptsForUISourceCode(this._uiSourceCode)) {
                if (originScript.hasSourceURL) {
                    const item = UI.UIUtils.formatLocalized('(provided via debug info by %s)', [Components.Linkifier.Linkifier.linkifyURL(originScript.sourceURL)]);
                    return [new UI.Toolbar.ToolbarItem(item)];
                }
            }
        }
        // Handle anonymous scripts with an originStackTrace.
        const script = await ScriptOriginPlugin._script(this._uiSourceCode);
        if (!script || !script.originStackTrace) {
            return [];
        }
        const link = linkifier.linkifyStackTraceTopFrame(script.debuggerModel.target(), script.originStackTrace);
        return [new UI.Toolbar.ToolbarItem(link)];
    }
    /**
     * @param {!Workspace.UISourceCode.UISourceCode} uiSourceCode
     * @return {!Promise<?SDK.Script.Script>}
     */
    static async _script(uiSourceCode) {
        const locations = await Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().uiLocationToRawLocations(uiSourceCode, 0, 0);
        for (const location of locations) {
            const script = location.script();
            if (script && script.originStackTrace) {
                return script;
            }
        }
        return null;
    }
}
export const linkifier = new Components.Linkifier.Linkifier();
//# sourceMappingURL=ScriptOriginPlugin.js.map