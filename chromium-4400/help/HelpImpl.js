// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/* eslint-disable rulesdir/no_underscored_properties */
import * as Common from '../common/common.js'; // eslint-disable-line no-unused-vars
import * as Host from '../host/host.js';
import * as UI from '../ui/ui.js'; // eslint-disable-line no-unused-vars
import { releaseNoteText } from './ReleaseNoteText.js';
export const releaseVersionSeen = 'releaseNoteVersionSeen';
export const releaseNoteViewId = 'release-note';
let _latestReleaseNote;
export function latestReleaseNote() {
    // @ts-ignore Included only for layout tests.
    const globalReleaseNotes = self.Help.releaseNoteText;
    if (!_latestReleaseNote) {
        _latestReleaseNote =
            (globalReleaseNotes || releaseNoteText).reduce((acc, note) => note.version > acc.version ? note : acc);
    }
    return _latestReleaseNote;
}
export function showReleaseNoteIfNeeded() {
    const releaseNoteVersionSetting = Common.Settings.Settings.instance().createSetting(releaseVersionSeen, 0);
    const releaseNoteVersionSettingValue = releaseNoteVersionSetting.get();
    innerShowReleaseNoteIfNeeded(releaseNoteVersionSettingValue, latestReleaseNote().version, Common.Settings.Settings.instance().moduleSetting('help.show-release-note').get());
}
export function innerShowReleaseNoteIfNeeded(lastSeenVersion, latestVersion, showReleaseNote) {
    const releaseNoteVersionSetting = Common.Settings.Settings.instance().createSetting(releaseVersionSeen, 0);
    if (!lastSeenVersion) {
        releaseNoteVersionSetting.set(latestVersion);
        return;
    }
    if (!showReleaseNote) {
        return;
    }
    if (lastSeenVersion >= latestVersion) {
        return;
    }
    releaseNoteVersionSetting.set(latestVersion);
    UI.ViewManager.ViewManager.instance().showView(releaseNoteViewId, true);
}
export class HelpLateInitialization {
    async run() {
        if (!Host.InspectorFrontendHost.isUnderTest()) {
            showReleaseNoteIfNeeded();
        }
    }
}
export class ReleaseNotesActionDelegate {
    handleAction(_context, _actionId) {
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(latestReleaseNote().link);
        return true;
    }
}
export class ReportIssueActionDelegate {
    handleAction(_context, _actionId) {
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab('https://bugs.chromium.org/p/chromium/issues/entry?template=DevTools+issue');
        return true;
    }
}
