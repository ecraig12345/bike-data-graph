import produce from 'immer';
import { unstable_batchedUpdates } from 'react-dom';
import create, { StateCreator } from 'zustand';
import { fetchFile, FetchFileResponse } from './fetchFile';
import { nextColor } from './randomColor';
import { Series, FileInfo, FilePath, SeriesId, SeriesMutable } from './types';

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
  addSeries: (ser: SeriesId & Partial<SeriesMutable>) => void;
  removeSeries: (ser: SeriesId) => void;
  reorderSeries: (ser: SeriesId, dir: 'up' | 'down') => void;
  updateSeries: (original: SeriesId, updates: Partial<SeriesMutable>) => void;
};

/**
 * Workaround for being unable to find series by object equality due to immer proxies...
 * Also allows finding the "matching" series by filePath and yField when updating.
 */
const findSeriesIndex = (state: State, ser: SeriesId) =>
  state.series.findIndex((s) => s.filePath === ser.filePath && s.yField === ser.yField);

const initSeries = (ser: SeriesId & Partial<SeriesMutable>): Series => ({
  color: nextColor(),
  smooth: 0,
  ...ser,
});

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
            state.series.push(...series.map(initSeries));
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

  setTimeField: (filePath, timeField) =>
    set((state) => {
      state.timeFields[filePath] = timeField;
    }),

  addSeries: (ser) =>
    set((state) => {
      state.series.push(initSeries(ser));
    }),

  removeSeries: (ser) =>
    set((state) => {
      const idx = findSeriesIndex(state, ser);
      idx !== -1 && state.series.splice(idx, 1);
    }),

  reorderSeries: (ser, dir) =>
    set((state) => {
      const idx = findSeriesIndex(state, ser);
      const count = state.series.length;
      if (idx !== -1 && ((dir === 'up' && idx > 0) || (dir === 'down' && idx < count - 1))) {
        const value = state.series.splice(idx, 1)[0];
        state.series.splice(dir === 'up' ? idx - 1 : idx + 1, 0, value);
      }
    }),

  updateSeries: (original, updates) =>
    set((state) => {
      const idx = findSeriesIndex(state, original);
      if (idx !== -1) {
        const ser = state.series[idx];
        for (const [k, v] of Object.entries(updates)) {
          if (v !== undefined) {
            (ser as any)[k] = v;
          }
        }
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
