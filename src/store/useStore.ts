import { unstable_batchedUpdates } from 'react-dom';
import create, { StateCreator } from 'zustand';
// import { devtools } from 'zustand/middleware';
import { addFile, AddFileResponse } from '../utils/request/addFile';
import { FileInfo, FileSettings, FilePath, ChartSettings } from '../types';
import immerMiddleware from './immerMiddleware';
import { createSeriesSlice, SeriesSlice } from './seriesSlice';
import applyUpdates from './applyUpdates';

export type State = SeriesSlice & {
  /** map from file path to file data */
  files: Record<FilePath, FileInfo>;
  /** map from file path to mutable file settings */
  filesSettings: Record<FilePath, FileSettings>;
  /** most recent error running `addFile` (cleared on success) */
  lastFetchError?: { filePath: string; error: string };
  chartSettings: ChartSettings;

  /** Fetch/convert a file. Returns true if it succeeded. */
  addFile: (file: string | File) => Promise<boolean>;
  /** Update settings for a file */
  updateFileSettings: (filePath: string, updates: Partial<FileSettings>) => void;
  /** Remove file and related series */
  removeFile: (filePath: string) => void;

  updateChartSettings: (updates: Partial<ChartSettings>) => void;
};

const config: StateCreator<State> = (set, get) => ({
  ...createSeriesSlice(set as any, get as any),

  files: {},
  filesSettings: {},
  chartSettings: {},

  // NOTE: directly setting values on state because `set` is wrapped with immer `produce`

  addFile: async (file) => {
    set((state) => {
      delete state.lastFetchError;
    });

    const filePath = typeof file === 'string' ? file : file.name;
    let result: AddFileResponse;
    try {
      result = await addFile(file);
    } catch (err) {
      set((state) => {
        state.lastFetchError = { filePath, error: (err as Error).message || String(err) };
      });
      return false;
    }

    unstable_batchedUpdates(() => {
      set((state) => {
        delete state.lastFetchError;
        const { fileInfo, fileMeta } = result as AddFileResponse;
        state.files[filePath] = fileInfo;
        state.filesSettings[filePath] = fileMeta;
      });
    });

    return true;
  },

  updateFileSettings: (filePath, updates) =>
    set((state) => {
      applyUpdates(state.filesSettings[filePath], updates);
    }),

  removeFile: (filePath) =>
    set((state) => {
      delete state.files[filePath];
      delete state.filesSettings[filePath];
      state.series = state.series.filter((s) => s.filePath !== filePath);
    }),

  updateChartSettings: (updates) =>
    set((state) => {
      applyUpdates(state.chartSettings, updates, true /*allowUndefined*/);
    }),
});

// export const useStore = create(devtools(immerMiddleware(config)));
export const useStore = create(immerMiddleware(config));
