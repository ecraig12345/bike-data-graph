import type { ChartDataset, InteractionItem, ScatterDataPoint } from 'chart.js';
import { useStore } from '../../store/useStore';
import type { FileInfo, FilePath, FileSettings, ReadFileData, Series } from '../../types';
import { smooth } from '../../utils/chart/smooth';

export type BikeChartType = 'line';

/** Array of scatter data points */
export type BikeChartData = ScatterDataPoint[];

export type BikeChartDataset = ChartDataset<BikeChartType, BikeChartData> & {
  /** Ensures there's a unique key to identify each series (label may not be unique) */
  seriesKey: string;
};

/** Time series data: field name and values from a particular file */
export type TimeSeriesData = { fieldName: string; offset?: number; values: number[] };
/** Map from file path to time series data */
export type TimeSeriesRecord = Record<FilePath, TimeSeriesData>;
/** Complete data points for a particular series */
export type SeriesData = {
  /** uniquely identifies the series, including file path, y field, time field */
  key: string;
  /**
   * for identifying the corresponding Series object (it's not saved here b/c it might have
   * other updates that don't affect the data calculation)
   */
  seriesKey: string;
  /** x/y data points for the series */
  data: BikeChartData;
  /** max y value in this series */
  yMax: number;
  mean: number;
  stddev: number;
};

export const datasetIdKey: keyof Pick<BikeChartDataset, 'seriesKey'> = 'seriesKey';

/** get things that should be included in the key for a time series */
export function getTimeSeriesKeyParts(filePath: string, fileSettings: FileSettings) {
  return [filePath, fileSettings.timeField, fileSettings.offset];
}

/** get a key for a series object INCLUDING time data and offset */
export function getCompleteSeriesKey(ser: Series, filesSettings: Record<FilePath, FileSettings>) {
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

/** get a series matching the given key (as calculated by `getSeriesKey`) */
export function getSeriesWithKey(series: Series[], seriesKey: string) {
  return series.find((ser) => getSeriesKey(ser) === seriesKey);
}

/** Get the data points and stats for a series */
export function getSeriesData(
  completeSeriesKey: string,
  ser: Series,
  timeSer: TimeSeriesData,
  file: FileInfo
): SeriesData {
  let yMax = 0;
  // calculate sum for mean/stddev
  // (shouldn't overflow even for long rides/high power: 500*60*60*24 = 43200000)
  let sum = 0;

  const data = file.rawData.map((r, i) => {
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

  return { key: completeSeriesKey, seriesKey: getSeriesKey(ser), yMax, mean, stddev, data };
}

/** Get the complete raw record objects from each file corresponding to points in an interaction */
export function getRawDataForInteraction(points: InteractionItem[], datasets: BikeChartDataset[]) {
  const dataForPoints: { [filePath: string]: ReadFileData } = {};
  const { files, series } = useStore.getState();

  for (const p of points) {
    const dataset = datasets[p.datasetIndex];
    const ser = getSeriesWithKey(series, dataset.seriesKey);
    const filePath = ser?.filePath;
    const file = filePath && files[filePath];
    const fileData = file && file.rawData[p.index];
    if (!fileData || dataForPoints[filePath]) {
      continue;
    }

    dataForPoints[filePath] = fileData;
  }
  return dataForPoints;
}

/**
 * Given raw data points from different files, try to find latitude/longitude values
 * in degrees based on the field names and values
 */
export function getLocation(rawData: ReadFileData[]) {
  for (const record of rawData) {
    const fields = Object.keys(record);
    const latField = fields.find((f) => /(^|[^a-z])lat(itude)?\b/i.test(f));
    const lat = latField && Number(record[latField as any]);

    const longField = fields.find((f) => /(^|[^a-z])long(itude)?\b/i.test(f));
    const long = longField && Number(record[longField as any]);

    // verify that the values are probably in degrees
    if (lat && Math.abs(lat) <= 90 && long && Math.abs(long) <= 180) {
      return { lat, long };
    }
  }
}
