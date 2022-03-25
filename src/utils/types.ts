/** converted data from a fit file, with roughly original field names */
export type ConvertedFitData = {
  /** string of datetime */
  timestamp: string;
  /** hh:mm:ss */
  time: string;
  /** hh:mm:ss */
  duration: string;
  'position_lat[deg]': number;
  'position_long[deg]': number;
  'distance[mi]': number;
  'altitude[ft]': number;
  'speed[mph]': number;
  'cadence[rpm]'?: number;
  'heart_rate[bpm]': number;
  'temperature[F]': number;
  'power[W]': number;
  'power2[W]'?: number;
  'cadence2[rpm]'?: number;
};

export type FilesDataFolder = {
  name: string;
  files: string[];
};

export type FilesData = FilesDataFolder[];

export type ReadonlyRecord<K extends string | number | symbol, V> = Readonly<Record<K, V>>;

/** list of records from a file (immutable) */
export type ReadFileData = ReadonlyArray<ReadonlyRecord<string, string | number>>;

/** alias of string for documentation */
export type FilePath = string;

/** browser-side file data and metadata (immutable) */
export type FileInfo = Readonly<{
  /** original file/folder path, used as unique key */
  filePath: string;
  /** initial display name for file */
  displayName: string;
  /** data from file (with any conversions applied on server) */
  rawData: ReadFileData;
  /** list of all field names in the data */
  allFields: ReadonlyArray<string>;
}>;

/**
 * Info about a series on the chart ("dataset" in chartjs terms).
 * "Key" is `filePath` + `yField`.
 */
export type Series = {
  /** file/folder path this series is from */
  filePath: string;
  /** name of the field to graph on the y-axis */
  yField: string;
  /** color for the series */
  color: string;
  // /** display name for the series */
  // label: string;
};

export type ConvertFileBody = {
  filePath: string;
  csvData: string;
  convert?: boolean;
};
