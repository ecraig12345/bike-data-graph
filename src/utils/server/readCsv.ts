import { parse, transform } from 'csv';
import type { Transformer } from 'stream-transform';
import * as fs from 'fs-extra';
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
 * @returns Stream of record objects, with column headers as keys
 */
export function readCsvStream(filePath: string, convertNumbers?: boolean): Transformer {
  const inStream = fs.createReadStream(filePath);

  return inStream
    .pipe(
      parse({
        columns: true,
        skipEmptyLines: true,
        relaxColumnCountLess: true,
        toLine: 20,
      })
    )
    .pipe(transform((record: any) => (convertNumbers ? mapValues(record, maybeToNumber) : record)));
}

/**
 * Read a CSV file with column headers.
 * @param filePath File path to convert
 * @param convertNumbers Whether to convert strings that appear to be numbers
 * @returns Array of record objects, with column headers as keys
 */
export async function readCsv<T>(
  filePath: string,
  convertNumbers?: boolean
): Promise<Record<string, T>[]> {
  return streamToArray(readCsvStream(filePath, convertNumbers));
}
