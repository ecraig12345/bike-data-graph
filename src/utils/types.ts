/** converted data from a fit file, with roughly original field names */
export type ConvertedFitData = {
  timestamp: Date;
  /** hh:mm:ss */
  time: string;
  duration: string;
  lat: number;
  long: number;
  /** mi */
  distance: number;
  /** ft */
  altitude: number;
  /** mi/hr */
  speed: number;
  cadence: number;
  /** F */
  temperature: number;
  power: number;
  Power2: number;
  Cadence2: number;
};

export type FilesDataFolder = {
  name: string;
  files: string[];
};

export type FilesData = FilesDataFolder[];

export type ReadFileData = Record<string, string | number | Date>[];

export type ResponseData<Data> = { data: Data };

export type ErrorData = { error: string };

export type ApiResponse<Data> = ResponseData<Data> | ErrorData;
