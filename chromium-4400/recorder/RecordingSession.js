// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/* eslint-disable rulesdir/no_underscored_properties */
import * as Common from '../common/common.js'; // eslint-disable-line no-unused-vars
import * as SDK from '../sdk/sdk.js';
import { RecordingEventHandler } from './RecordingEventHandler.js';
export class StepFrameContext {
    constructor(target, path = []) {
        this.path = path;
        this.target = target;
    }
    toString() {
        let expression = StepFrameContext.getExpressionForTarget(this.target) + '\n';
        expression += 'const frame = targetPage.mainFrame()';
        for (const index of this.path) {
            expression += `.childFrames()[${index}]`;
        }
        expression += ';';
        return expression;
    }
    static getExpressionForTarget(target) {
        if (target === 'main') {
            return 'const targetPage = page;';
        }
        return `const target = await browser.waitForTarget(p => p.url() === ${JSON.stringify(target)});
  const targetPage = await target.page();`;
    }
}
export class Step {
    constructor(action) {
        this.action = action;
    }
    toString() {
        throw new Error('Must be implemented in subclass.');
    }
}
export class ClickStep extends Step {
    constructor(context, selector) {
        super('click');
        this.context = context;
        this.selector = selector;
    }
    toString() {
        return `{
  ${this.context}
  const element = await frame.waitForSelector(${JSON.stringify(this.selector)});
  await element.click();
  }`;
    }
}
export class NavigationStep extends Step {
    constructor(url) {
        super('navigate');
        this.url = url;
    }
    toString() {
        return `await page.goto(${JSON.stringify(this.url)});`;
    }
}
export class SubmitStep extends Step {
    constructor(context, selector) {
        super('submit');
        this.context = context;
        this.selector = selector;
    }
    toString() {
        return `{
  ${this.context}
  const element = await frame.waitForSelector(${JSON.stringify(this.selector)});
  await element.evaluate(form => form.submit());
  }`;
    }
}
export class ChangeStep extends Step {
    constructor(context, selector, value) {
        super('change');
        this.context = context;
        this.selector = selector;
        this.value = value;
    }
    toString() {
        return `{
  ${this.context}
  const element = await frame.waitForSelector(${JSON.stringify(this.selector)});
  await element.type(${JSON.stringify(this.value)});
  }`;
    }
}
export class CloseStep extends Step {
    constructor(target) {
        super('close');
        this.target = target;
    }
    toString() {
        return `{
  ${StepFrameContext.getExpressionForTarget(this.target)}
  await targetPage.close();
  }`;
    }
}
export class EmulateNetworkConditions extends Step {
    constructor(conditions) {
        super('emulateNetworkConditions');
        this.conditions = conditions;
    }
    toString() {
        // TODO(crbug.com/1161438): Update once puppeteer has better support for this
        return `{
      // Simulated network throttling (${this.conditions.title})
      const client = await page.target().createCDPSession();
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
      // Network connectivity is absent
      offline: ${!this.conditions.download && !this.conditions.upload},
      // Download speed (bytes/s)
      downloadThroughput: ${this.conditions.download},
      // Upload speed (bytes/s)
      uploadThroughput: ${this.conditions.upload},
      // Latency (ms)
      latency: ${this.conditions.latency},
      });
  }`;
    }
}
const DOM_BREAKPOINTS = new Set(['Mouse:click', 'Control:change', 'Control:submit']);
export class RecordingSession {
    constructor(target, uiSourceCode) {
        this._target = target;
        this._uiSourceCode = uiSourceCode;
        this._currentIndentation = 0;
        this._debuggerAgent = target.debuggerAgent();
        this._domDebuggerAgent = target.domdebuggerAgent();
        this._runtimeAgent = target.runtimeAgent();
        this._accessibilityAgent = target.accessibilityAgent();
        this._pageAgent = target.pageAgent();
        this._targetAgent = target.targetAgent();
        this._networkManager = SDK.NetworkManager.MultitargetNetworkManager.instance();
        this._domModel = target.model(SDK.DOMModel.DOMModel);
        this._axModel =
            target.model(SDK.AccessibilityModel.AccessibilityModel);
        this._debuggerModel = target.model(SDK.DebuggerModel.DebuggerModel);
        this._resourceTreeModel =
            target.model(SDK.ResourceTreeModel.ResourceTreeModel);
        this._runtimeModel = target.model(SDK.RuntimeModel.RuntimeModel);
        this._childTargetManager = target.model(SDK.ChildTargetManager.ChildTargetManager);
        this._target = target;
        this._eventHandlers = new Map();
        this._targets = new Set();
        this._initialDomBreakpointState = new Map();
        this._interestingBreakpoints = [];
        this._newDocumentScriptIdentifier = null;
    }
    async start() {
        const allDomBreakpoints = SDK.DOMDebuggerModel.DOMDebuggerManager.instance().eventListenerBreakpoints();
        this._interestingBreakpoints =
            allDomBreakpoints.filter(breakpoint => DOM_BREAKPOINTS.has(breakpoint.category() + ':' + breakpoint.title()));
        for (const breakpoint of this._interestingBreakpoints) {
            this._initialDomBreakpointState.set(breakpoint, breakpoint.enabled());
            breakpoint.setEnabled(true);
        }
        this._networkManager.addEventListener(SDK.NetworkManager.MultitargetNetworkManager.Events.ConditionsChanged, this._handleNetworkConditionsChanged, this);
        this.attachToTarget(this._target);
        const mainTarget = SDK.SDKModel.TargetManager.instance().mainTarget();
        if (!mainTarget) {
            throw new Error('Could not find main target');
        }
        const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
        if (!resourceTreeModel) {
            throw new Error('Could not find resource tree model');
        }
        const mainFrame = resourceTreeModel.mainFrame;
        if (!mainFrame) {
            throw new Error('Could not find main frame');
        }
        await this.appendLineToScript('const puppeteer = require(\'puppeteer\');');
        await this.appendLineToScript('');
        await this.appendLineToScript('(async () => {');
        this._currentIndentation += 1;
        await this.appendLineToScript('const browser = await puppeteer.launch();');
        await this.appendLineToScript('const page = await browser.newPage();');
        await this.appendLineToScript('');
        const networkConditions = this._networkManager.networkConditions();
        if (networkConditions !== SDK.NetworkManager.NoThrottlingConditions) {
            await this.appendStepToScript(new EmulateNetworkConditions(networkConditions));
        }
        await this.appendStepToScript(new NavigationStep(mainFrame.url));
    }
    _handleNetworkConditionsChanged() {
        const networkConditions = this._networkManager.networkConditions();
        this.appendStepToScript(new EmulateNetworkConditions(networkConditions));
    }
    async stop() {
        for (const target of this._targets) {
            await this.detachFromTarget(target);
        }
        await this.detachFromTarget(this._target);
        this._networkManager.removeEventListener(SDK.NetworkManager.MultitargetNetworkManager.Events.ConditionsChanged, this._handleNetworkConditionsChanged, this);
        await this.appendLineToScript('await browser.close();');
        this._currentIndentation -= 1;
        await this.appendLineToScript('})();');
        await this.appendLineToScript('');
        if (this._newDocumentScriptIdentifier) {
            await this._pageAgent.invoke_removeScriptToEvaluateOnNewDocument({ identifier: this._newDocumentScriptIdentifier });
        }
        await this._debuggerModel.ignoreDebuggerPausedEvents(false);
        for (const [breakpoint, enabled] of this._initialDomBreakpointState.entries()) {
            breakpoint.setEnabled(enabled);
        }
    }
    async appendLineToScript(line) {
        let content = this._uiSourceCode.content();
        const indent = Common.Settings.Settings.instance().moduleSetting('textEditorIndent').get();
        content += (indent.repeat(this._currentIndentation) + line).trimRight() + '\n';
        await this._uiSourceCode.setContent(content, false);
        const lastLine = content.split('\n').length;
        Common.Revealer.reveal(this._uiSourceCode.uiLocation(lastLine), true);
    }
    async appendStepToScript(step) {
        const lines = step.toString().split('\n').map(l => l.trim());
        for (const line of lines) {
            if (line === '}') {
                this._currentIndentation -= 1;
            }
            await this.appendLineToScript(line);
            if (line === '{') {
                this._currentIndentation += 1;
            }
        }
    }
    async isSubmitButton(targetId) {
        function innerIsSubmitButton() {
            return this.tagName === 'BUTTON' && this.type === 'submit' && this.form !== null;
        }
        const { result } = await this._runtimeAgent.invoke_callFunctionOn({
            functionDeclaration: innerIsSubmitButton.toString(),
            objectId: targetId,
        });
        return result.value;
    }
    async attachToTarget(target) {
        this._targets.add(target);
        const eventHandler = new RecordingEventHandler(this, target);
        this._eventHandlers.set(target.id(), eventHandler);
        target.registerDebuggerDispatcher(eventHandler);
        const pageAgent = target.pageAgent();
        const debuggerModel = target.model(SDK.DebuggerModel.DebuggerModel);
        const childTargetManager = target.model(SDK.ChildTargetManager.ChildTargetManager);
        const setupEventListeners = `
  if (!window.__recorderEventListener) {
  const recorderEventListener = (event) => { };
  window.addEventListener('click', recorderEventListener, true);
  window.addEventListener('submit', recorderEventListener, true);
  window.addEventListener('change', recorderEventListener, true);
  window.__recorderEventListener = recorderEventListener;
  }
  `;
        // This uses the setEventListenerBreakpoint method from the debugger
        // to get notified about new events. Therefor disable the normal debugger
        // while recording.
        await debuggerModel.resumeModel();
        await debuggerModel.ignoreDebuggerPausedEvents(true);
        const { identifier } = await pageAgent.invoke_addScriptToEvaluateOnNewDocument({ source: setupEventListeners });
        this._newDocumentScriptIdentifier = identifier;
        await this.evaluateInAllFrames(target, setupEventListeners);
        childTargetManager?.addEventListener(SDK.ChildTargetManager.Events.TargetCreated, this.handleWindowOpened, this);
        childTargetManager?.addEventListener(SDK.ChildTargetManager.Events.TargetDestroyed, this.handleWindowClosed, this);
    }
    async detachFromTarget(target) {
        const eventHandler = this._eventHandlers.get(target.id());
        if (!eventHandler) {
            return;
        }
        target.unregisterDebuggerDispatcher(eventHandler);
        const debuggerModel = target.model(SDK.DebuggerModel.DebuggerModel);
        await debuggerModel.ignoreDebuggerPausedEvents(false);
    }
    async evaluateInAllFrames(target, expression) {
        const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
        const runtimeModel = target.model(SDK.RuntimeModel.RuntimeModel);
        const executionContexts = runtimeModel.executionContexts();
        for (const frame of resourceTreeModel.frames()) {
            const executionContext = executionContexts.find(context => context.frameId === frame.id);
            if (!executionContext) {
                continue;
            }
            await executionContext.evaluate({
                expression,
                objectGroup: undefined,
                includeCommandLineAPI: undefined,
                silent: undefined,
                returnByValue: undefined,
                generatePreview: undefined,
                allowUnsafeEvalBlockedByCSP: undefined,
                throwOnSideEffect: undefined,
                timeout: undefined,
                disableBreaks: undefined,
                replMode: undefined,
            }, true, false);
        }
    }
    async handleWindowOpened(event) {
        if (event.data.type !== 'page') {
            return;
        }
        const executionContexts = this._runtimeModel.executionContexts();
        const executionContext = executionContexts.find(context => context.frameId === event.data.openerFrameId);
        if (!executionContext) {
            throw new Error('Could not find execution context in opened frame.');
        }
        await this._targetAgent.invoke_attachToTarget({ targetId: event.data.targetId, flatten: true });
        const target = SDK.SDKModel.TargetManager.instance().targets().find(t => t.id() === event.data.targetId);
        if (!target) {
            throw new Error('Could not find target.');
        }
        this.attachToTarget(target);
    }
    async handleWindowClosed(event) {
        const eventHandler = this._eventHandlers.get(event.data);
        if (!eventHandler) {
            return;
        }
        eventHandler.targetDestroyed();
    }
}
//# sourceMappingURL=RecordingSession.js.map