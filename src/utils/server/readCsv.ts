import { parse, transform } from 'csv';
import fs from 'fs-extra';
import { Readable } from 'stream';
import type { Transformer } from 'stream-transform';
import { streamToArray } from './streamToArray';

const NUM_REGEX = /^-?\d*\.?\d+$/;

function maybeToNumber(v: any) {
  return NUM_REGEX.test(v) ? Number(v) : v;
}

export type CsvInputOptions = (
  | {
      type: 'file';
      /** CSV file to read from */
      filePath: string;
    }
  | {
      type: 'string';
      /** CSV data */
      data: string;
    }
) & {
  /** Limit on number of lines to read */
  limit?: number;
};

type CsvOutputOptions = {
  /** Whether to convert values that appear to be numbers */
  convertNumbers?: boolean;
};
type CsvOutputOptionsStream = { type: 'stream' } & CsvOutputOptions;
type CsvOutputOptionsArray = { type: 'array'; sortByField?: string } & CsvOutputOptions;

/**
 * Read/parse a CSV file with column headers.
 *
 * @param inputOptions If `inputOptions.type` is `file`, read from the file path and parse.
 * If it's `string`, just parse the given data.
 * @param outputOptions If `outputOptions.type` is `stream`, return a stream of record objects
 * (with column headers as keys). If it's `array`, return an array of record objects.
 * @returns Stream or array of record objects, with column headers as keys.
 */
export function readCsv<T>(
  inputOptions: CsvInputOptions,
  outputOptions: CsvOutputOptionsArray
): Promise<T[]>;
export function readCsv<T>(
  inputOptions: CsvInputOptions,
  outputOptions: CsvOutputOptionsStream
): Transformer;
export function readCsv<T>(
  inputOptions: CsvInputOptions,
  outputOptions: CsvOutputOptionsArray | CsvOutputOptionsStream
) {
  const { limit } = inputOptions;
  const inStream =
    inputOptions.type === 'file'
      ? fs.createReadStream(inputOptions.filePath)
      : Readable.from(inputOptions.data);

  const outStream = inStream
    .pipe(
      parse({
        columns: true,
        skipEmptyLines: true,
        relaxColumnCountLess: true,
        ...(limit && { toLine: limit }),
      })
    )
    .pipe(
      transform((record: any) =>
        outputOptions.convertNumbers
          ? Object.fromEntries(Object.entries(record).map(([k, v]) => [k, maybeToNumber(v)]))
          : record
      )
    );

  return outputOptions.type === 'array'
    ? streamToArray<T>(outStream, outputOptions.sortByField)
    : outStream;
}
