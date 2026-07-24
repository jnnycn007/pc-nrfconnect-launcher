/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '../../store';

export type State = {
    autoUpdatingAppName: string | undefined;
};

const initialState: State = {
    autoUpdatingAppName: undefined,
};

const slice = createSlice({
    name: 'autoUpdate',
    initialState,
    reducers: {
        showAutoUpdateDialog(state, { payload }: PayloadAction<string>) {
            state.autoUpdatingAppName = payload;
        },
        hideAutoUpdateDialog(state) {
            state.autoUpdatingAppName = undefined;
        },
    },
});

export default slice.reducer;

export const { showAutoUpdateDialog, hideAutoUpdateDialog } = slice.actions;

export const getAutoUpdatingApp = (state: RootState) =>
    state.autoUpdate.autoUpdatingAppName;
