import { parse } from 'csv';
import type { Options as CsvParseOptions } from 'csv-parse';
import fs from 'fs-extra';
import { Readable } from 'stream';

export type CsvInputOptions = (
  | { type: 'file' }
  | {
      type: 'string';
      /** CSV data */
      data: string;
    }
) & {
  /** CSV path, either to read or where the data already came from */
  filePath: string;
  /** Limit on number of lines to read */
  limit?: number;
  /** 1-indexed line to start parsing from */
  fromLine?: number;
};

export function getCsvParseOptions(limit?: number, fromLine?: number): CsvParseOptions {
  return {
    columns: true,
    skipEmptyLines: true,
    relaxColumnCountLess: true,
    ...(fromLine && { fromLine }),
    ...(limit && { toLine: limit }),
  };
}

/**
 * Read/parse a CSV file with column headers.
 *
 * @param inputOptions If `inputOptions.type` is `file`, read from the file path and parse.
 * If it's `string`, just parse the given data.
 * @returns Stream of record objects, with column headers as keys.
 */
export function readCsv(inputOptions: CsvInputOptions) {
  const { limit, fromLine } = inputOptions;
  const inStream =
    inputOptions.type === 'file'
      ? fs.createReadStream(inputOptions.filePath)
      : Readable.from(inputOptions.data);

  return inStream.pipe(parse(getCsvParseOptions(limit, fromLine)));
}
