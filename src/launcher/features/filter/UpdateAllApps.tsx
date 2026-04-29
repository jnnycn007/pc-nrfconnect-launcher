/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React from 'react';
import Button from 'react-bootstrap/Button';

import { useLauncherDispatch, useLauncherSelector } from '../../util/hooks';
import { updateDownloadableApp } from '../apps/appsEffects';
import { getUpdatableVisibleApps, isInProgress } from '../apps/appsSlice';

export default () => {
    const dispatch = useLauncherDispatch();
    const updatableApps = useLauncherSelector(getUpdatableVisibleApps);

    const updateAllApps = () =>
        updatableApps
            .filter(app => !isInProgress(app))
            .forEach(app => {
                dispatch(updateDownloadableApp(app));
            });

    if (updatableApps.length === 0) return null;

    const areAllUpdatableAppsInProgress = updatableApps.every(isInProgress);

    return (
        <Button
            variant="outline-secondary"
            disabled={areAllUpdatableAppsInProgress}
            onClick={updateAllApps}
        >
            Update all apps
        </Button>
    );
};
