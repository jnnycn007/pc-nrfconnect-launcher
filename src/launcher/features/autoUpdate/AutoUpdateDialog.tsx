/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import {
    DialogButton,
    GenericDialog,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { useLauncherSelector } from '../../util/hooks';
import { getAutoUpdatingApp } from './autoUpdateDialogSlice';

export default () => {
    const autoUpdatingApp = useLauncherSelector(getAutoUpdatingApp);

    if (!autoUpdatingApp) {
        return null;
    }

    return (
        <GenericDialog
            isVisible
            title={`Updating ${autoUpdatingApp}`}
            showSpinner
            closeOnUnfocus={false}
            footer={
                <DialogButton onClick={() => {}} disabled>
                    Close
                </DialogButton>
            }
        >
            <p>
                The {autoUpdatingApp} app is now updating. It will open after
                the update.
            </p>
        </GenericDialog>
    );
};
