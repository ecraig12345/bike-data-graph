export type FilesDataFolder = {
  name: string;
  files: string[];
};

export type FilesData = FilesDataFolder[];

export type ReadonlyRecord<K extends string | number | symbol, V> = Readonly<Record<K, V>>;

/** record from a file (immutable) */
export type ReadFileData = ReadonlyRecord<string, string | number>;

/** alias of string for documentation */
export type FilePath = string;

/** browser-side file data and metadata (immutable) */
export type FileInfo = Readonly<{
  /** original file/folder path, used as unique key */
  filePath: string;
  /** data from file (with any conversions applied on server) */
  rawData: ReadonlyArray<ReadFileData>;
  /** list of all field names in the data */
  allFields: ReadonlyArray<string>;
}>;

export type FileSettings = {
  displayName: string;
  timeField?: string;
  offset?: number;
};

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
  /** whether/how much to smooth the final data */
  smooth: number;
  /** display name for the series */
  label: string;
};

export type SeriesId = Required<Pick<Series, 'filePath' | 'yField'>>;
export type SeriesMutable = Omit<Series, keyof SeriesId>;

export type ConvertFileBody = {
  filePath: string;
  csvData: string;
  format?: 'fit' | 'velocomp';
};

export type ChartSettings = {
  yBound?: number;
};
