import { unstable_batchedUpdates } from 'react-dom';
import create, { StateCreator } from 'zustand';
import { addFile, AddFileResponse } from '../addFile';
import { FileInfo, FileSettings, FilePath } from '../types';
import immerMiddleware from './immerMiddleware';
import { createSeriesSlice, initSeries, SeriesSlice } from './seriesSlice';

export type State = SeriesSlice & {
  /** map from file path to file data */
  files: Record<FilePath, FileInfo>;
  /** map from file path to mutable file settings */
  filesSettings: Record<FilePath, FileSettings>;
  /** most recent error running `addFile` (cleared on success) */
  lastFetchError?: { filePath: string; error: string };

  /** Fetch/convert file and possibly init related series */
  addFile: (filePath: string, csvData?: string, addSeries?: boolean) => Promise<void>;
  /** Update settings for a file */
  updateFileSettings: (filePath: string, updates: Partial<FileSettings>) => void;
  /** Remove file and related series */
  removeFile: (filePath: string) => void;
};

const config: StateCreator<State> = (set, get) => ({
  ...createSeriesSlice(set as any, get as any),

  files: {},
  filesSettings: {},

  // NOTE: directly setting values on state because `set` is wrapped with immer `produce`

  addFile: async (filePath, csvData, addSeries) => {
    set((state) => {
      delete state.lastFetchError;
    });

    const result = await addFile(filePath, csvData);

    unstable_batchedUpdates(() => {
      set((state) => {
        if ((result as any).error) {
          state.lastFetchError = { filePath, error: (result as any).error };
        } else {
          delete state.lastFetchError;
          const { fileInfo, fileMeta, series } = result as AddFileResponse;
          state.files[filePath] = fileInfo;
          state.filesSettings[filePath] = fileMeta;
          if (series && addSeries) {
            state.series.push(...series.map(initSeries));
          }
        }
      });
    });
  },

  updateFileSettings: (filePath, updates) =>
    set((state) => {
      const settings = state.filesSettings[filePath];
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) {
          (settings as any)[k] = v;
        }
      }
    }),

  removeFile: (filePath) =>
    set((state) => {
      delete state.files[filePath];
      state.series = state.series.filter((s) => s.filePath !== filePath);
    }),
});

export const useStore = create(immerMiddleware(config));
