import produce from 'immer';
import { unstable_batchedUpdates } from 'react-dom';
import create, { StateCreator } from 'zustand';
import { fetchFile, FetchFileData } from './fetchFile';
import { Series, FileError, FileInfo } from './types';

// type Primitive = undefined | null | boolean | string | number | Function;

// type DeepImmutable<T> = T extends Primitive
//   ? T
//   : T extends Array<infer U>
//   ? DeepImmutableArray<U>
//   : DeepImmutableObject<T>;

// interface DeepImmutableArray<T> extends ReadonlyArray<DeepImmutable<T>> {}
// type DeepImmutableObject<T> = {
//   readonly [K in keyof T]: DeepImmutable<T[K]>;
// };

export type State = {
  files: Record<string, FileInfo>;
  lastFileError?: FileError;
  series: Series[];

  /** Fetch file and possibly init related series */
  fetchFile: (filePath: string) => Promise<void>;
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
  series: [],

  // NOTE: directly setting values on state because `set` is wrapped with immer `produce`

  fetchFile: async (filePath: string) => {
    const result = await fetchFile(filePath);
    unstable_batchedUpdates(() => {
      set((state) => {
        if ((result as any).error) {
          state.lastFileError = { filePath, error: (result as any).error };
        } else {
          delete state.lastFileError;
          const { fileInfo, series } = result as FetchFileData;
          state.files[filePath] = fileInfo;
          if (series) {
            state.series.push(...series);
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
      state.files[filePath].timeField = timeField;
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
