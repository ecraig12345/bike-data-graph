import produce from 'immer';
import { unstable_batchedUpdates } from 'react-dom';
import create, { StateCreator } from 'zustand';
import { fetchFile, FetchFileResponse } from './fetchFile';
import { Series, FileInfo, FilePath } from './types';

export type State = {
  /** map from file path to file data */
  files: Record<FilePath, FileInfo>;
  /** map from file path to timestamp field name */
  timeFields: Record<FilePath, string>;
  /** list of series currently being graphed */
  series: Series[];
  /** most recent error running `fetchFile` (cleared on success) */
  lastFetchError?: { filePath: string; error: string };

  /** Fetch/convert file and possibly init related series */
  fetchFile: (filePath: string, csvData?: string) => Promise<void>;
  /** Remove file and related series */
  removeFile: (filePath: string) => void;

  /** Set the time field for all series from a file */
  setTimeField: (filePath: string, timeField: string) => void;

  // TODO should all of this be the responsibility of the store?
  addSeries: (ser: Series) => void;
  removeSeries: (ser: Series) => void;
  reorderSeries: (ser: Series, dir: 'up' | 'down') => void;
};

/** Workaround for being unable to find series by object equality due to immer proxies... */
const findSeriesIndex = (state: State, ser: Series) =>
  state.series.findIndex((s) => s.filePath === ser.filePath && s.yField === ser.yField);

const config: StateCreator<State> = (set) => ({
  files: {},
  timeFields: {},
  series: [],

  // NOTE: directly setting values on state because `set` is wrapped with immer `produce`

  fetchFile: async (filePath: string, csvData?: string) => {
    const result = await fetchFile(filePath, csvData);
    unstable_batchedUpdates(() => {
      set((state) => {
        if ((result as any).error) {
          state.lastFetchError = { filePath, error: (result as any).error };
        } else {
          delete state.lastFetchError;
          const { fileInfo, timeField, series } = result as FetchFileResponse;
          state.files[filePath] = fileInfo;
          if (series) {
            state.series.push(...series);
          }
          if (timeField) {
            state.timeFields[filePath] = timeField;
          }
        }
      });
    });
  },

  removeFile: (filePath: string) =>
    set((state) => {
      if (state.files[filePath]) {
        delete state.files[filePath];
        state.series = state.series.filter((s) => s.filePath !== filePath);
      }
    }),

  setTimeField: (filePath: string, timeField: string) =>
    set((state) => {
      state.timeFields[filePath] = timeField;
    }),

  addSeries: (ser: Series) =>
    set((state) => {
      state.series.push(ser);
    }),

  removeSeries: (ser: Series) =>
    set((state) => {
      const idx = findSeriesIndex(state, ser);
      idx !== -1 && state.series.splice(idx, 1);
    }),

  reorderSeries: (ser: Series, dir: 'up' | 'down') =>
    set((state) => {
      const idx = findSeriesIndex(state, ser);
      const count = state.series.length;
      if (idx !== -1 && ((dir === 'up' && idx > 0) || (dir === 'down' && idx < count - 1))) {
        state.series.splice(idx, 1);
        state.series.splice(dir === 'up' ? idx - 1 : idx + 1, 0, ser);
      }
    }),
});

// immer middleware
// https://medium.com/plumguide/a-look-into-react-state-management-in-2021-5fc46a247e65
function immer(conf: StateCreator<State>): StateCreator<State> {
  return (set, get, api) => {
    // Overwrite the `set` function with the `produce` method from Immer
    return conf(
      (partial, replace) => {
        const nextState = typeof partial === 'function' ? produce(partial) : partial;
        return set(nextState as any, replace);
      },
      get,
      api
    );
  };
}

export const useStore = create(immer(config));
