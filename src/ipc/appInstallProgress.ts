/*
 * Copyright (c) 2022 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    on,
    send,
} from '@nordicsemiconductor/pc-nrfconnect-shared/ipc/infrastructure/mainToRenderer';

import type { AppSpec, DownloadableApp } from './apps';

const channel = {
    start: 'app-install:start',
    progress: 'app-install:progress',
    success: 'app-install:success',
};

// Start
type StartAppInstall = (app: AppSpec, fractionNames: string[]) => void;

const reportAppInstallStart = send<StartAppInstall>(channel.start);
const registerAppInstallStart = on<StartAppInstall>(channel.start);

// Progress
export type Progress = {
    app: AppSpec;
    progressFraction: number;
    fractionName: string;
};

type DownloadProgress = (progress: Progress) => void;

const reportAppInstallProgress = send<DownloadProgress>(channel.progress);
const registerAppInstallProgress = on<DownloadProgress>(channel.progress);

type AppInstallSuccess = (app: DownloadableApp) => void;

const reportAppInstallSuccess = send<AppInstallSuccess>(channel.success);
const registerAppInstallSuccess = on<AppInstallSuccess>(channel.success);

export const forMain = {
    registerAppInstallStart,
    registerAppInstallProgress,
    registerAppInstallSuccess,
};
export const inRenderer = {
    reportAppInstallStart,
    reportAppInstallProgress,
    reportAppInstallSuccess,
};
