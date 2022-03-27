import React from 'react';
import dynamic from 'next/dynamic';
import type { ChartDataset, ChartOptions, ScatterDataPoint } from 'chart.js';
import { State, useStore } from '../utils/store/useStore';
import FieldPicker from './FieldPicker';
import { FilePath, FileSettings, Series } from '../utils/types';
import type { LineChartProps } from './LineChart';
import { smooth } from '../utils/smooth';

const LineChart = dynamic(
  () => import('./LineChart'),
  // a dep of the zoom plugin tries to access window on import
  { ssr: false }
);

const yTickStep = 50;

const filesSettingsSelector = (s: State) => s.filesSettings;
const seriesSelector = (s: State) => s.series;

/** Time series data: field name and values from a particular file */
type TimeSeriesData = { fieldName: string; values: number[] };
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
};

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
        Object.entries(filesSettings).map(([filePath, fileSettings]) => [
          filePath,
          fileSettings.timeField,
        ])
      ),
    [filesSettings]
  );

  // map from file path to cached time series data
  const timeSeries = React.useRef<TimeSeriesRecord>({});

  React.useEffect(() => {
    const { files, filesSettings } = useStore.getState(); // don't notify of files updates
    const oldTimeSeries = timeSeries.current;
    const newTimeSeries: typeof oldTimeSeries = {};

    for (const [filePath, { timeField }] of Object.entries(filesSettings)) {
      if (timeField && oldTimeSeries[filePath]?.fieldName === timeField) {
        // same time field name => don't re-calculate (the raw data never changes)
        newTimeSeries[filePath] = oldTimeSeries[filePath];
      } else if (timeField) {
        // new file or newly-set time field => calculate
        newTimeSeries[filePath] = {
          fieldName: timeField,
          values: files[filePath].rawData.map((r) => new Date(r[timeField]).getTime()),
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
    ser.filePath,
    ser.yField,
    ser.smooth,
    filesSettings[ser.filePath].timeField,
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
      const timeSer = timeSeries.current[ser.filePath];
      const seriesKey = getCompleteSeriesKey(ser, filesSettings);
      const oldSer = oldData.find((s) => s.key === seriesKey);
      if (oldSer) {
        return oldSer;
      }

      let yMax = 0;
      const data = files[ser.filePath].rawData.map((r, i) => {
        const d = {
          x: timeSer.values[i],
          y: Number(r[ser.yField]),
        };
        yMax = Math.max(yMax, d.y);
        return d;
      });
      if (ser.smooth) {
        yMax = smooth(data, ser.smooth, ser.smooth);
      }

      return { key: seriesKey, seriesKey: getSeriesKey(ser), yMax, data };
    });

    seriesData.current = newData;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only recalculate on relevant updates
  }, [seriesKey]);

  return [seriesData, seriesKey] as const;
}

function getChartOptions(seriesData: SeriesData[]) {
  // include 0 in case there are no series defined currently
  const yMax = Math.max(0, ...seriesData.map((s) => s.yMax));
  const yBound = yMax + (yTickStep - (yMax % yTickStep));
  const displayName = Object.values(useStore.getState().filesSettings)
    .map((f) => f.displayName)
    .join(', ');

  const options: ChartOptions<'line'> = {
    animation: false,
    normalized: true,
    parsing: false,
    spanGaps: false,
    scales: {
      x: {
        type: 'time',
        time: { minUnit: 'minute' },
        // keep rotation consistent while zooming
        ticks: { maxRotation: 45, minRotation: 45 },
      },
      y: {
        type: 'linear',
        // Specify max so the axis doesn't change scale when zooming
        max: yBound,
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
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: displayName,
        font: { size: 24 },
      },
      subtitle: {
        display: true,
        text: ['Pinch, scroll, or click and drag to zoom. Shift+drag to pan.', ''],
        font: { size: 14 },
      },
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

  // The data is stored in a ref and updated in an effect, so also run final calculations in an
  // effect (not memo) to ensure the latest data is used.
  React.useEffect(() => {
    setProps({
      datasetIdKey,
      options: getChartOptions(seriesData.current),
      data: {
        datasets: seriesData.current.map((serData): ChartDataset<'line', ScatterDataPoint[]> => {
          // find the matching series object (it should exist)
          const ser = series.find((ser) => getSeriesKey(ser) === serData.seriesKey)!;

          return {
            label: ser.label,
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
  }, [seriesKey, series]);

  return (
    <>
      {props && <LineChart {...props} />}
      <FieldPicker />
    </>
  );
};

export default ChartStuff;
