/** converted data from a fit file, with roughly original field names */
export type ConvertedFitData = {
  /** epoch seconds */
  timestamp: number;
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

export type ReadFileData = Record<string, string | number>[];
