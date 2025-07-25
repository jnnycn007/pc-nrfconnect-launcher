/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import {
    PackageJsonLegacyApp,
    parsePackageJsonLegacyApp,
} from '@nordicsemiconductor/pc-nrfconnect-shared/main';
import fs from 'fs';
import path from 'path';

import { Source } from '../../../common/sources';
import { getAppsRootDir, getNodeModulesDir } from '../../config';
import { readFile, readJsonFile } from '../../fileUtil';
import { installedAppPath, writeAppInfo } from '../app';
import {
    sourceJsonExistsLocally,
    writeSourceJson,
} from '../sources/sourceJson';
import { writeWithdrawnJson } from '../sources/withdrawnJson';

type AppName = `pc-nrfconnect-${string}`;

interface UpdatesJson {
    [app: AppName]: string;
}

interface LegacyAppInfo {
    displayName: string;
    description: string;
    url: string;
    homepage?: string;
}

interface AppsJson {
    _source?: string;
    [app: AppName]: LegacyAppInfo;
}

const updatesJsonFile = (source: Source) =>
    path.join(getAppsRootDir(source.name), 'updates.json');

const appsJsonFile = (source: Source) =>
    path.join(getAppsRootDir(source.name), 'apps.json');

const legacyMetaFilesExist = (source: Source) =>
    fs.existsSync(appsJsonFile(source));

const getSource = (appsJson: AppsJson) => appsJson._source ?? 'official'; // eslint-disable-line no-underscore-dangle

const isAppEntry = (
    appInfo: [string, LegacyAppInfo]
): appInfo is [AppName, LegacyAppInfo] => !appInfo[0].startsWith('_');

const appEntries = (appsJson: AppsJson) =>
    Object.entries(appsJson).filter(isAppEntry);

export const convertAppsJsonToSourceJson = (appsJson: AppsJson) => ({
    name: getSource(appsJson),
    apps: appEntries(appsJson).map(([, appInfo]) => `${appInfo.url}.json`),
});

export const createNewAppInfo = (
    appName: AppName,
    appsJson: AppsJson,
    updatesJson: UpdatesJson,
    packageJson: PackageJsonLegacyApp | null
) => {
    const appInfo = appsJson[appName];

    const latestVersion = updatesJson[appName];
    return {
        name: appName,
        displayName: packageJson?.displayName ?? appInfo.displayName,
        description: packageJson?.description ?? appInfo.description,
        homepage: packageJson?.homepage ?? appInfo.homepage,
        iconUrl: `${appInfo.url}.svg`,
        releaseNotesUrl: `${appInfo.url}-Changelog.md`,
        latestVersion,
        versions: {
            [latestVersion]: {
                tarballUrl: `${appInfo.url}-${latestVersion}.tgz`,
            },
        },
        installed:
            packageJson == null
                ? undefined
                : {
                      path: installedAppPath({
                          name: appName,
                          source: getSource(appsJson),
                      }),
                  },
    };
};

const createNewAppInfoForWithdrawnApp = (
    source: Source,
    appName: AppName,
    packageJson: PackageJsonLegacyApp,
    oldAppUrl: string
) => ({
    name: appName,
    displayName: packageJson.displayName,
    description: packageJson.description,
    homepage: packageJson.homepage,
    iconUrl: `${oldAppUrl}.svg`,
    releaseNotesUrl: `${oldAppUrl}-Changelog.md`,
    versions: {},
    latestVersion: packageJson.version,
    installed: {
        path: installedAppPath({
            name: appName,
            source: source.name,
        }),
    },
});

const createWithDrawnAppFiles = (withdrawnAppName: AppName, source: Source) => {
    const packageJsonFile = path.join(
        installedAppPath({ name: withdrawnAppName, source: source.name }),
        'package.json'
    );
    if (!fs.existsSync(path.join(packageJsonFile))) {
        return;
    }

    const oldAppUrl = `${path.dirname(source.url)}/${withdrawnAppName}`;
    writeWithdrawnJson(source, [`${oldAppUrl}.json`]);

    const packageJsonResult = parsePackageJsonLegacyApp(
        readFile(packageJsonFile)
    );

    if (!packageJsonResult.success) {
        throw new Error(packageJsonResult.error.message);
    }

    writeAppInfo(
        createNewAppInfoForWithdrawnApp(
            source,
            withdrawnAppName,
            packageJsonResult.data,
            oldAppUrl
        ),
        source
    );
};

const migrateLegacyMetaFiles = (source: Source) => {
    const appsJson = readJsonFile<AppsJson>(appsJsonFile(source));
    const updatesJson = readJsonFile<UpdatesJson>(updatesJsonFile(source), {});

    writeSourceJson(source, convertAppsJsonToSourceJson(appsJson));

    appEntries(appsJson).forEach(([appName]) => {
        if (updatesJson[appName] == null) {
            return;
        }

        const packageJsonFile = path.join(
            getNodeModulesDir(source.name),
            appName,
            'package.json'
        );

        if (fs.existsSync(packageJsonFile)) {
            const packageJsonResult = parsePackageJsonLegacyApp(
                readFile(packageJsonFile)
            );

            const packageJson = packageJsonResult.success
                ? packageJsonResult.data
                : null;

            writeAppInfo(
                createNewAppInfo(appName, appsJson, updatesJson, packageJson),
                source
            );
        }
    });

    createWithDrawnAppFiles('pc-nrfconnect-gettingstarted', source);
};

export const maybeMigrateLegacyMetaFiles = (source: Source) => {
    if (!sourceJsonExistsLocally(source) && legacyMetaFilesExist(source)) {
        migrateLegacyMetaFiles(source);
    }
};
