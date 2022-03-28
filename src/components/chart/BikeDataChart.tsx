import React from 'react';
import dynamic from 'next/dynamic';
import type { Chart, ChartOptions } from 'chart.js';
import type { IContextualMenuItem } from '@fluentui/react/lib/ContextualMenu';
import { State, useStore } from '../../store/useStore';
import type { ChartSettings } from '../../types';
import type { LineChartProps } from './LineChart';
import {
  BikeChartData,
  BikeChartDataset,
  BikeChartType,
  datasetIdKey,
  getCompleteSeriesKey,
  getLocation,
  getRawDataForInteraction,
  getSeriesData,
  getSeriesWithKey,
  getTimeSeriesKeyParts,
  SeriesData,
  TimeSeriesRecord,
} from './bikeChartHelpers';
import DataDialog, { DataDialogProps } from './DataDialog';

const LineChart = dynamic(
  () => import('./LineChart'),
  // a dep of the zoom plugin tries to access window on import
  { ssr: false }
);

const yTickStep = 50;

const filesSettingsSelector = (s: State) => s.filesSettings;
const seriesSelector = (s: State) => s.series;
const chartSettingsSelector = (s: State) => s.chartSettings;

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
      return oldSer || getSeriesData(seriesKey, ser, timeSer, files[ser.filePath]);
    });

    seriesData.current = newData;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only recalculate on relevant updates
  }, [seriesKey]);

  return [seriesData, seriesKey] as const;
}

/** get chart options (called inside an effect that gets the chart props) */
function getChartOptions(seriesData: SeriesData[], chartSettings: ChartSettings) {
  // include 0 in case there are no series defined currently
  const yMax = Math.max(0, ...seriesData.map((s) => s.yMax));
  const defaultYBound = yMax + (yTickStep - (yMax % yTickStep));

  const options: ChartOptions<BikeChartType> = {
    animation: false,
    normalized: true,
    parsing: false,
    spanGaps: false,
    // when hovering over a time on the graph, show a tooltip with all the values at that time
    // (don't have to hover the points/lines themselves)
    interaction: { intersect: false, mode: 'index' },
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

const BikeDataChart: React.FunctionComponent = () => {
  const chartRef = React.useRef<Chart<BikeChartType, BikeChartData>>(null);
  const [props, setProps] = React.useState<LineChartProps>();
  const [dialogProps, setDialogProps] = React.useState<DataDialogProps>();

  const [seriesData, seriesKey] = useSeriesData();
  // The series objects are not cached with the data because they have additional properties
  // (like color) that may update separately, where updates are less expensive
  const series = useStore(seriesSelector);
  const chartSettings = useStore(chartSettingsSelector);

  // The data is stored in a ref and updated in an effect, so also run final calculations in an
  // effect (not memo) to ensure the latest data is used.
  React.useEffect(() => {
    const newProps: LineChartProps<BikeChartData> = {
      datasetIdKey,
      options: getChartOptions(seriesData.current, chartSettings),
      chartRef,
      data: {
        datasets: seriesData.current.map((serData): BikeChartDataset => {
          // find the matching series object (it should exist)
          const ser = getSeriesWithKey(series, serData.seriesKey)!;

          return {
            label: ser.label,
            seriesKey: serData.seriesKey,
            backgroundColor: ser.color,
            borderColor: ser.color,
            borderWidth: 1,
            pointRadius: 0,
            data: serData.data,
          };
        }),
      },
      getContextualMenuItems: (points) => {
        const items: IContextualMenuItem[] = [
          {
            key: 'resetZoom',
            text: 'Reset zoom',
            onClick: () => {
              chartRef.current!.resetZoom();
            },
          },
        ];
        if (!points.length) {
          return items;
        }

        const datasets = newProps.data.datasets as BikeChartDataset[];
        const rawData = getRawDataForInteraction(points, datasets);
        // use the x value at the first point (rather than a time field value from rawData)
        // to account for offsets properly
        const time = new Date(datasets[points[0].datasetIndex].data[points[0].index].x);

        items.unshift({
          key: 'showData',
          text: `Show all data at ${time.toLocaleTimeString()}`,
          onClick: () => {
            setDialogProps({
              data: rawData,
              time: time.toLocaleString(),
              onDismiss: () => setDialogProps(undefined),
            });
          },
        });

        // try to get a menu item to open the point on a map
        const loc = getLocation(Object.values(rawData));
        if (loc) {
          items.unshift({
            key: 'open',
            text: `Open map of location at ${time.toLocaleTimeString()}`,
            onClick: () => {
              window.open(`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.long}`);
            },
          });
        }

        return items;
      },
    };
    setProps(newProps);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only recalculate on relevant updates
  }, [seriesKey, series, chartSettings]);

  return props ? (
    <>
      <LineChart {...props} />
      {dialogProps && <DataDialog {...dialogProps} />}
    </>
  ) : null;
};

export default BikeDataChart;
