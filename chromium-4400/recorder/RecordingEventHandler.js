// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Elements from '../elements/elements.js';
import * as SDK from '../sdk/sdk.js';
import { ChangeStep, ClickStep, CloseStep, StepFrameContext, SubmitStep } from './RecordingSession.js';
const RELEVANT_ROLES_FOR_ARIA_SELECTORS = new Set(['button', 'link', 'textbox', 'checkbox']);
export class RecordingEventHandler {
    constructor(session, target) {
        this.target = target;
        this.session = session;
        this.runtimeAgent = target.runtimeAgent();
        this.debuggerAgent = target.debuggerAgent();
        this.runtimeModel = target.model(SDK.RuntimeModel.RuntimeModel);
        this.resourceTreeModel =
            target.model(SDK.ResourceTreeModel.ResourceTreeModel);
        this.domModel = target.model(SDK.DOMModel.DOMModel);
        this.axModel = target.model(SDK.AccessibilityModel.AccessibilityModel);
    }
    async isSubmitButton(targetId) {
        function innerIsSubmitButton() {
            return this.tagName === 'BUTTON' && this.type === 'submit' && this.form !== null;
        }
        const { result } = await this.runtimeAgent.invoke_callFunctionOn({
            functionDeclaration: innerIsSubmitButton.toString(),
            objectId: targetId,
        });
        return result.value;
    }
    async getSelector(node) {
        const ariaSelector = await this.getAriaSelector(node);
        if (ariaSelector) {
            return ariaSelector;
        }
        const cssSelector = Elements.DOMPath.cssPath(node);
        if (cssSelector) {
            return cssSelector;
        }
        return null;
    }
    async findTargetId(localFrame, interestingClassNames) {
        const event = localFrame.find(prop => Boolean(prop && prop.value && prop.value.className && interestingClassNames.includes(prop.value.className)));
        if (!event || !event.value || !event.value.objectId) {
            return null;
        }
        const eventProperties = await this.runtimeAgent.invoke_getProperties({
            objectId: event.value.objectId,
        });
        if (!eventProperties) {
            return null;
        }
        const target = eventProperties.result.find(prop => prop.name === 'target');
        if (!target || !target.value) {
            return null;
        }
        return target.value.objectId || null;
    }
    async getAriaSelector(node) {
        await this.axModel.requestPartialAXTree(node);
        let axNode = this.axModel.axNodeForDOMNode(node);
        while (axNode) {
            const roleObject = axNode.role();
            const nameObject = axNode.name();
            const role = roleObject ? roleObject.value : null;
            const name = nameObject ? nameObject.value : null;
            if (name && RELEVANT_ROLES_FOR_ARIA_SELECTORS.has(role)) {
                return `aria/${name}`;
            }
            axNode = axNode.parentNode();
        }
        return null;
    }
    async handleClickEvent(context, localFrame) {
        const targetId = await this.findTargetId(localFrame, [
            'MouseEvent',
            'PointerEvent',
        ]);
        if (!targetId) {
            this.skip();
            return;
        }
        const node = await this.domModel.pushNodeToFrontend(targetId);
        if (!node) {
            throw new Error('Node should not be null.');
        }
        // Clicking on a submit button will emit a submit event
        // which will be handled in a different handler.
        if (node.nodeName() === 'BUTTON' && node.getAttribute('type') === 'submit') {
            this.skip();
            return;
        }
        const selector = await this.getSelector(node);
        if (!selector) {
            throw new Error('Could not find selector');
        }
        this.session.appendStepToScript(new ClickStep(context, selector));
        await this.resume();
    }
    async handleSubmitEvent(context, localFrame) {
        const targetId = await this.findTargetId(localFrame, [
            'SubmitEvent',
        ]);
        if (!targetId) {
            this.skip();
            return;
        }
        const node = await this.domModel.pushNodeToFrontend(targetId);
        if (!node) {
            throw new Error('Node should not be null.');
        }
        const selector = await this.getSelector(node);
        if (!selector) {
            throw new Error('Could not find selector');
        }
        this.session.appendStepToScript(new SubmitStep(context, selector));
        await this.resume();
    }
    async handleChangeEvent(context, localFrame) {
        const targetId = await this.findTargetId(localFrame, [
            'Event',
        ]);
        if (!targetId) {
            this.skip();
            return;
        }
        const node = await this.domModel.pushNodeToFrontend(targetId);
        if (!node) {
            throw new Error('Node should not be null.');
        }
        const selector = await this.getSelector(node);
        if (!selector) {
            throw new Error('Could not find selector');
        }
        function getValue() {
            return this.value;
        }
        const { result } = await this.runtimeAgent.invoke_callFunctionOn({
            functionDeclaration: getValue.toString(),
            objectId: targetId,
        });
        this.session.appendStepToScript(new ChangeStep(context, selector, result.value));
        await this.resume();
    }
    getTarget() {
        return this.target.id() === 'main' ? 'main' : this.target.inspectedURL();
    }
    getContextForFrame(frame) {
        const path = [];
        let currentFrame = frame;
        while (currentFrame) {
            const parentFrame = currentFrame.parentFrame();
            if (!parentFrame) {
                break;
            }
            const childFrames = parentFrame.childFrames;
            const index = childFrames.indexOf(currentFrame);
            path.unshift(index);
            currentFrame = parentFrame;
        }
        const target = this.getTarget();
        return new StepFrameContext(target, path);
    }
    async resume() {
        await this.debuggerAgent.invoke_setSkipAllPauses({ skip: true });
        await this.debuggerAgent.invoke_resume({ terminateOnResume: false });
        await this.debuggerAgent.invoke_setSkipAllPauses({ skip: false });
    }
    async skip() {
        await this.debuggerAgent.invoke_resume({ terminateOnResume: false });
    }
    paused(params) {
        if (params.reason !== 'EventListener') {
            this.skip();
            return;
        }
        const eventName = params.data.eventName;
        const localFrame = params.callFrames[0].scopeChain[0];
        const scriptId = params.callFrames[0].location.scriptId;
        const executionContextId = this.runtimeModel.executionContextIdForScriptId(scriptId);
        const executionContext = this.runtimeModel.executionContext(executionContextId);
        if (!executionContext) {
            throw new Error('Could not find execution context.');
        }
        if (!executionContext.frameId) {
            throw new Error('Execution context is not assigned to a frame.');
        }
        const frame = this.resourceTreeModel.frameForId(executionContext.frameId);
        if (!frame) {
            throw new Error('Could not find frame.');
        }
        const context = this.getContextForFrame(frame);
        if (!localFrame.object.objectId) {
            return;
        }
        this.runtimeAgent.invoke_getProperties({ objectId: localFrame.object.objectId }).then(async ({ result }) => {
            switch (eventName) {
                case 'listener:click':
                    return this.handleClickEvent(context, result);
                case 'listener:submit':
                    return this.handleSubmitEvent(context, result);
                case 'listener:change':
                    return this.handleChangeEvent(context, result);
                default:
                    this.skip();
            }
        });
    }
    targetDestroyed() {
        this.session.appendStepToScript(new CloseStep(this.getTarget()));
    }
    breakpointResolved() {
        // Added here to fullfill the ProtocolProxyApi.DebuggerDispatcher interface.
    }
    resumed() {
        // Added here to fullfill the ProtocolProxyApi.DebuggerDispatcher interface.
    }
    scriptFailedToParse() {
        // Added here to fullfill the ProtocolProxyApi.DebuggerDispatcher interface.
    }
    scriptParsed() {
        // Added here to fullfill the ProtocolProxyApi.DebuggerDispatcher interface.
    }
}
