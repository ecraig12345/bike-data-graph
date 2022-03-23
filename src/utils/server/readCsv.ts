import { parse, transform } from 'csv';
import type { Transformer } from 'stream-transform';
import fs from 'fs-extra';
import mapValues from 'lodash-es/mapValues';
import { streamToArray } from './streamToArray';

const NUM_REGEX = /^-?\d*\.?\d+$/;

function maybeToNumber(v: any) {
  return NUM_REGEX.test(v) ? Number(v) : v;
}

/**
 * Read a CSV file with column headers.
 * @param filePath File path to convert
 * @param convertNumbers Whether to convert strings that appear to be numbers
 * @param limit Limit on number of lines to read
 * @returns Stream of record objects, with column headers as keys
 */
export function readCsvStream(
  filePath: string,
  convertNumbers?: boolean,
  limit?: number
): Transformer {
  const inStream = fs.createReadStream(filePath);

  return inStream
    .pipe(
      parse({
        columns: true,
        skipEmptyLines: true,
        relaxColumnCountLess: true,
        ...(limit && { toLine: limit }),
      })
    )
    .pipe(transform((record: any) => (convertNumbers ? mapValues(record, maybeToNumber) : record)));
}

/**
 * Read a CSV file with column headers.
 * @param filePath File path to convert
 * @param convertNumbers Whether to convert strings that appear to be numbers
 * @param sortByField Optional field to sort the result by
 * @returns Array of record objects, with column headers as keys
 */
export function readCsv<T>(
  filePath: string,
  convertNumbers?: boolean,
  sortByField?: keyof T
): Promise<Record<string, T>[]> {
  return streamToArray(readCsvStream(filePath, convertNumbers), sortByField as string | undefined);
}
