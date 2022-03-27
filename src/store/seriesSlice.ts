import { nextColor } from '../utils/chart/randomColor';
import { Series, SeriesId, SeriesMutable } from '../types';
import { StoreSlice } from './types';
import applyUpdates from './applyUpdates';

// https://github.com/pmndrs/zustand/wiki/Splitting-the-store-into-separate-slices

export type SeriesSlice = {
  /** list of series currently being graphed */
  series: Series[];

  addSeries: (ser: SeriesId & Partial<SeriesMutable>) => void;
  removeSeries: (ser: SeriesId) => void;
  reorderSeries: (ser: SeriesId, dir: 'up' | 'down') => void;
  updateSeries: (original: SeriesId, updates: Partial<SeriesMutable>) => void;
};

/**
 * Workaround for being unable to find series by object equality due to immer proxies...
 * Also allows finding the "matching" series by filePath and yField when updating.
 */
const findSeriesIndex = (state: SeriesSlice, ser: SeriesId) =>
  state.series.findIndex((s) => s.filePath === ser.filePath && s.yField === ser.yField);

export const createSeriesSlice: StoreSlice<SeriesSlice> = (set) => ({
  series: [],

  // NOTE: directly setting values on state because `set` is wrapped with immer `produce`

  addSeries: (ser) =>
    set((state) => {
      if (state.series.some((s) => s.filePath === ser.filePath && s.yField === ser.yField)) {
        throw new Error(`Series already exists for "${ser.filePath}" and "${ser.yField}"`);
      }
      state.series.push({
        color: nextColor(),
        smooth: 0,
        label: ser.yField,
        ...ser,
      });
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
        applyUpdates(state.series[idx], updates);
      }
    }),
});
