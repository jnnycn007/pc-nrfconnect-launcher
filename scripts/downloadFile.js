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

const downloadChecksum = async fileUrl => {
    console.log('Downloading', fileUrl);
    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error(
            `Unable to download ${fileUrl}. Got status code ${response.status}`,
        );
    }

    return (await response.text()).trim().split(/\s+/)[0];
};

module.exports = async (fileUrl, destinationFile, useChecksum = false) => {
    const hash = crypto.createHash('sha256');

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

    const hashTransform = new TransformStream({
        transform(chunk, controller) {
            hash.update(chunk);
            controller.enqueue(chunk);
        },
    });

    await response.body
        .pipeThrough(hashTransform)
        .pipeTo(Writable.toWeb(fs.createWriteStream(destinationFile)));

    console.log('🏁 Finish Download', fileUrl);
    console.log('🏁 Saved to', destinationFile);

    if (useChecksum) {
        const calculatedChecksum = hash.digest('hex');
        const expectedChecksum = await downloadChecksum(`${fileUrl}.sha256`);

        if (calculatedChecksum !== expectedChecksum) {
            await unlink(destinationFile);
            console.log('Calculated checksum:', calculatedChecksum);
            console.log('Expected checksum:  ', expectedChecksum);
            throw new Error('Checksum verification failed.');
        }
    }
};
