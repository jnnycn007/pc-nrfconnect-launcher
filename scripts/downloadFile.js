/*
 * Copyright (c) 2023 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

const crypto = require('crypto');
const fs = require('fs');
const { mkdir, unlink } = require('fs/promises');
const path = require('path');
const { Writable } = require('stream');

const downloadChecksumFile = async fileUrl => {
    console.log('Downloading checksum file', fileUrl);
    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error(
            `Unable to download ${fileUrl}. Got status code ${response.status}`,
        );
    }
    return (await response.text()).trim().split(/\s+/)[0];
};

const createChecksumChecker = async fileUrl => {
    const expectedChecksum = await downloadChecksumFile(`${fileUrl}.sha256`);
    const hash = crypto.createHash('sha256');

    return {
        transformStream: () =>
            new TransformStream({
                transform: (chunk, controller) => {
                    hash.update(chunk);
                    controller.enqueue(chunk);
                },
            }),

        verify: async destinationFile => {
            const calculatedChecksum = hash.digest('hex');

            if (calculatedChecksum !== expectedChecksum) {
                console.log('Calculated checksum:', calculatedChecksum);
                console.log('Expected checksum:  ', expectedChecksum);

                await unlink(destinationFile);
                throw new Error('Checksum verification failed.');
            }
        },
    };
};

module.exports = async (fileUrl, destinationFile) => {
    const checksumChecker = await createChecksumChecker(fileUrl);

    console.log('🏎️ Started Download', fileUrl);
    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error(
            `Unable to download ${fileUrl}. Got status code ${response.status}`,
        );
    }
    if (!response.body) {
        throw new Error(`Unable to download ${fileUrl}: Empty response body`);
    }

    await mkdir(path.dirname(destinationFile), { recursive: true });

    await response.body
        .pipeThrough(checksumChecker.transformStream())
        .pipeTo(Writable.toWeb(fs.createWriteStream(destinationFile)));

    console.log('🏁 Finish Download', fileUrl);
    console.log('🏁 Saved to', destinationFile);

    await checksumChecker.verify(destinationFile);
};
