/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import chmodr from 'chmodr';
import fs from 'fs';
import path from 'path';
import targz from 'targz';
import { z } from 'zod';

import describeError from './describeError';

export const ifExists = (filePath: string) =>
    fs.existsSync(filePath) ? filePath : undefined;

export const readFile = (filePath: string) => {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        throw new Error(`Unable to read ${filePath}: ${describeError(error)}`);
    }
};

export const readJsonFile = <T>(filePath: string, defaultValue?: T) => {
    try {
        return <T>JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }

        throw new Error(`Unable to parse ${filePath}: ${describeError(error)}`);
    }
};
export const readSchemedJsonFile = <T extends z.ZodTypeAny>(
    filePath: string,
    schema: T,
    defaultValue?: z.infer<T>
): z.infer<T> => {
    try {
        const content = readJsonFile(filePath);
        return schema.parse(content);
    } catch (error) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }

        throw new Error(`Unable to parse ${filePath}: ${describeError(error)}`);
    }
};

const isDirectory = (dirPath: string) => (file: string) => {
    const fileStats = fs.statSync(path.join(dirPath, file));

    return fileStats.isDirectory() && !file.startsWith('.');
};

export const listDirectories = (dirPath: string): string[] =>
    !fs.existsSync(dirPath)
        ? []
        : fs.readdirSync(dirPath).filter(isDirectory(dirPath));

const isFile = (dirPath: string, file: string) => {
    const fileStats = fs.statSync(path.join(dirPath, file));
    return fileStats.isFile();
};

export const listFiles = (dirPath: string, filterRegex: RegExp) =>
    !fs.existsSync(dirPath)
        ? []
        : fs
              .readdirSync(dirPath)
              .filter(file => isFile(dirPath, file))
              .filter(file => filterRegex.test(file));

export const deleteFile = (filePath: string) => {
    try {
        fs.unlinkSync(filePath);
    } catch (error) {
        throw new Error(
            `Unable to delete ${filePath}: ${describeError(error)}`
        );
    }
};

export const copy = (src: string, dest: string) => {
    try {
        fs.cpSync(src, dest, { force: true, recursive: true });
    } catch (error) {
        throw new Error(`Unable to copy ${src}: ${describeError(error)}`);
    }
};

export const untar = (src: string, dest: string, stripComponents: number) => {
    const pattern = new RegExp(`(.*?/){${stripComponents}}`);
    return new Promise<void>((resolve, reject) => {
        targz.decompress(
            {
                src,
                dest,
                tar: {
                    map: header => ({
                        ...header,
                        name: header.name.replace(pattern, ''),
                    }),
                },
            },
            error => {
                if (error) {
                    reject(
                        new Error(
                            `Unable to extract ${src}: ${describeError(error)}`
                        )
                    );
                } else {
                    resolve();
                }
            }
        );
    });
};

const defaultMode =
    fs.constants.S_IRWXU | // eslint-disable-line no-bitwise
    fs.constants.S_IRGRP |
    fs.constants.S_IXGRP |
    fs.constants.S_IROTH |
    fs.constants.S_IXOTH;

export const chmod = (filePath: string, mode: fs.Mode = defaultMode) => {
    fs.chmodSync(filePath, mode);
};

export const chmodDir = (src: string, mode: fs.Mode = defaultMode) =>
    new Promise<void>((resolve, reject) => {
        chmodr(src, mode, error => {
            if (error) {
                reject(
                    new Error(
                        `Unable to change mode to ${src}: ${describeError(
                            error
                        )}`
                    )
                );
            } else {
                resolve();
            }
        });
    });

export const writeFile = (filePath: string, data: string) => {
    try {
        fs.writeFileSync(filePath, data);
    } catch (error) {
        throw new Error(`Unable to write ${filePath}: ${describeError(error)}`);
    }
};

export const writeJsonFile = (filePath: string, jsonData: unknown) =>
    writeFile(filePath, JSON.stringify(jsonData, undefined, 2));

export const writeSchemedJsonFile = <T extends z.ZodTypeAny>(
    filePath: string,
    schema: T,
    jsonData: z.infer<T>
) => {
    const parsed = schema.safeParse(jsonData);
    if (parsed.success) {
        writeJsonFile(filePath, parsed.data);
    } else {
        throw new Error(
            `Malformed data, not written to ${filePath}: ${parsed.error}`
        );
    }
};
