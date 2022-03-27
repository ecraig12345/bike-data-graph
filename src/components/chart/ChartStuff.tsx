import React from 'react';
import dynamic from 'next/dynamic';
import type { ChartDataset, ChartOptions, ScatterDataPoint } from 'chart.js';
import { State, useStore } from '../../store/useStore';
import { ChartSettings, FilePath, FileSettings, Series } from '../../types';
import type { LineChartProps } from './LineChart';
import { smooth } from '../../utils/chart/smooth';

const LineChart = dynamic(
  () => import('./LineChart'),
  // a dep of the zoom plugin tries to access window on import
  { ssr: false }
);

const yTickStep = 50;

const filesSettingsSelector = (s: State) => s.filesSettings;
const seriesSelector = (s: State) => s.series;
const chartSettingsSelector = (s: State) => s.chartSettings;

/** Time series data: field name and values from a particular file */
type TimeSeriesData = { fieldName: string; offset?: number; values: number[] };
/** Map from file path to time series data */
type TimeSeriesRecord = Record<FilePath, TimeSeriesData>;
/** Complete data points for a particular series */
type SeriesData = {
  /** uniquely identifies the series, including file path, y field, time field */
  key: string;
  /**
   * for identifying the corresponding Series object (it's not saved here b/c it might have
   * other updates that don't affect the data calculation)
   */
  seriesKey: string;
  /** x/y data points for the series */
  data: ScatterDataPoint[];
  /** max y value in this series */
  yMax: number;
  mean: number;
  stddev: number;
};

function getTimeSeriesKeyParts(filePath: string, fileSettings: FileSettings) {
  return [filePath, fileSettings.timeField, fileSettings.offset];
}

/**
 * get a ref with cached time series values, updating when files and/or time fields update
 * (a more tailored approach to memoizing and recalculating)
 */
function useTimeSeries() {
  const filesSettings = useStore(filesSettingsSelector);
  // key that includes only the relevant parts of filesSettings, to reduce recalculations
  const timeFieldsKey = React.useMemo(
    () =>
      JSON.stringify(
        Object.entries(filesSettings).map(([filePath, fileSettings]) =>
          getTimeSeriesKeyParts(filePath, fileSettings)
        )
      ),
    [filesSettings]
  );

  // map from file path to cached time series data
  const timeSeries = React.useRef<TimeSeriesRecord>({});

  React.useEffect(() => {
    const { files, filesSettings } = useStore.getState(); // don't notify of files updates
    const oldTimeSeries = timeSeries.current;
    const newTimeSeries: typeof oldTimeSeries = {};

    for (const [filePath, { timeField, offset }] of Object.entries(filesSettings)) {
      if (!timeField) {
        continue;
      }
      const oldData = oldTimeSeries[filePath];
      if (oldData?.fieldName === timeField && (oldData.offset || 0) === (offset || 0)) {
        // same time field name and offset => don't re-calculate (the raw data never changes)
        newTimeSeries[filePath] = oldData;
      } else {
        // new file, newly-set time field, or updated offset => calculate
        newTimeSeries[filePath] = {
          fieldName: timeField,
          offset,
          values: files[filePath].rawData.map(
            (r) => new Date(r[timeField]).getTime() + (offset || 0)
          ),
        };
      }
    }

    timeSeries.current = newTimeSeries;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only recalculate on relevant updates
  }, [timeFieldsKey]);

  return timeSeries;
}

/** get a key for a series object INCLUDING time data */
function getCompleteSeriesKey(ser: Series, filesSettings: Record<FilePath, FileSettings>) {
  return JSON.stringify([
    ser.yField,
    ser.smooth,
    ...getTimeSeriesKeyParts(ser.filePath, filesSettings[ser.filePath]),
  ]);
}
/** get a key for a series object NOT including time data */
function getSeriesKey(ser: Series) {
  return JSON.stringify([ser.filePath, ser.yField]);
}

/** get a ref with cached list of series points and maxes, updating when series, files, or time fields update */
function useSeriesData() {
  const series = useStore(seriesSelector);
  const filesSettings = useStore(filesSettingsSelector);
  const timeSeries = useTimeSeries();
  // series that have a corresponding time field set
  const readySeries = React.useMemo(
    () => series.filter((s) => !!filesSettings[s.filePath].timeField),
    [series, filesSettings]
  );
  const seriesKey = React.useMemo(
    () => JSON.stringify(readySeries.map((s) => getCompleteSeriesKey(s, filesSettings))),
    [readySeries, filesSettings]
  );
  const seriesData = React.useRef<SeriesData[]>([]);

  React.useEffect(() => {
    const { files } = useStore.getState(); // don't notify of files updates
    const oldData = seriesData.current;

    const newData = readySeries.map((ser): SeriesData => {
      // if the array of series has changed but the options for a particular series haven't,
      // use the previously-calculated data
      const timeSer = timeSeries.current[ser.filePath];
      const seriesKey = getCompleteSeriesKey(ser, filesSettings);
      const oldSer = oldData.find((s) => s.key === seriesKey);
      if (oldSer) {
        return oldSer;
      }

      let yMax = 0;
      // calculate sum for mean/stddev
      // (shouldn't overflow even for long rides/high power: 500*60*60*24 = 43200000)
      let sum = 0;
      const data = files[ser.filePath].rawData.map((r, i) => {
        const d = {
          x: timeSer.values[i],
          y: Number(r[ser.yField]) || 0,
        };
        yMax = Math.max(yMax, d.y);
        sum += d.y;
        return d;
      });
      if (ser.smooth) {
        yMax = smooth(data, ser.smooth, ser.smooth);
      }
      const mean = sum / data.length;
      const stddev = Math.sqrt(
        data.map((d) => Math.pow(d.y - mean, 2)).reduce((a, b) => a + b) / data.length
      );
      // right now these are just logged for information
      console.log(ser.yField, 'mean', mean, 'stddev', stddev, mean + stddev * 4);

      return { key: seriesKey, seriesKey: getSeriesKey(ser), yMax, mean, stddev, data };
    });

    seriesData.current = newData;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only recalculate on relevant updates
  }, [seriesKey]);

  return [seriesData, seriesKey] as const;
}

function getChartOptions(seriesData: SeriesData[], chartSettings: ChartSettings) {
  // include 0 in case there are no series defined currently
  const yMax = Math.max(0, ...seriesData.map((s) => s.yMax));
  const defaultYBound = yMax + (yTickStep - (yMax % yTickStep));

  const options: ChartOptions<'line'> = {
    animation: false,
    normalized: true,
    parsing: false,
    spanGaps: false,
    scales: {
      x: {
        type: 'time',
        time: { minUnit: 'minute' },
        // keep rotation consistent while zooming (also a perf optimization to not calculate this)
        ticks: { maxRotation: 45, minRotation: 45 },
      },
      y: {
        type: 'linear',
        // Specify max so the axis doesn't change scale when zooming
        max: chartSettings.yBound ?? defaultYBound,
        ticks: { stepSize: yTickStep },
      },
    },
    plugins: {
      // decimation: {
      //   enabled: true,
      //   algorithm: 'lttb',
      //   samples: 250,
      //   threshold: 250,
      // },
      zoom: {
        limits: {
          // can't zoom out beyond original data set or in beyond 3 minutes
          x: { min: 'original', max: 'original', minRange: 1000 * 60 * 3 },
        },
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: 'shift',
        },
        zoom: {
          drag: { enabled: true },
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
        },
      },
    },
  };

  return options;
}

const datasetIdKey = 'seriesKey';

const ChartStuff: React.FunctionComponent = () => {
  const [props, setProps] = React.useState<LineChartProps>();
  const [seriesData, seriesKey] = useSeriesData();
  // The series objects are not cached with the data because they have additional properties
  // (like color) that may update separately, where updates are less expensive
  const series = useStore(seriesSelector);
  const chartSettings = useStore(chartSettingsSelector);

  // The data is stored in a ref and updated in an effect, so also run final calculations in an
  // effect (not memo) to ensure the latest data is used.
  React.useEffect(() => {
    setProps({
      datasetIdKey,
      options: getChartOptions(seriesData.current, chartSettings),
      data: {
        datasets: seriesData.current.map((serData): ChartDataset<'line', ScatterDataPoint[]> => {
          // find the matching series object (it should exist)
          const ser = series.find((ser) => getSeriesKey(ser) === serData.seriesKey)!;

          return {
            label: ser.label,
            // ensure there's a unique key to identify each series (label may not be unique)
            [datasetIdKey as any]: serData.seriesKey,
            backgroundColor: ser.color,
            borderColor: ser.color,
            borderWidth: 1,
            pointRadius: 1,
            pointHitRadius: 3,
            data: serData.data,
          };
        }),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only recalculate on relevant updates
  }, [seriesKey, series, chartSettings]);

  return props ? <LineChart {...props} /> : null;
};

export default ChartStuff;
