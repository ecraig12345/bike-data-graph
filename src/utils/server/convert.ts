import { transform } from 'csv';
import type { Transformer } from 'stream-transform';
import { CsvInputOptions, readCsv } from './readCsv';
import { streamToArray } from './streamToArray';
import { ReadFileData } from '../../types';
import { convertRecord, ConvertState } from './convertRecord';

function getFileFormat(filePath: string) {
  const filename = filePath.split(/[\\/]/g).slice(-1)[0];
  return filename.includes('records_data')
    ? 'fit'
    : /velocomp|ibike/i.test(filename)
    ? 'velocomp'
    : undefined;
}

export type ConvertInputOptions = CsvInputOptions & { format?: 'fit' | 'velocomp' };

/**
 * Convert CSV data from the records_data format generated by the FIT SDK's conversion tool
 * OR the exported format from velocomp/ibike (powerpod) and return the records.
 * @param inputOptions If `inputOptions.type` is `file`, read from the file path and parse/convert.
 * If it's `string`, just parse/convert the given data.
 * @param outputOptions If `outputOptions.type` is `stream`, return a stream of record objects.
 * If it's `array`, return an array of record objects.
 */
export function convert(
  inputOptions: ConvertInputOptions,
  outputType?: 'array'
): Promise<ReadFileData[]>;
export function convert(inputOptions: ConvertInputOptions, outputType: 'stream'): Transformer;
export function convert(
  inputOptions: ConvertInputOptions,
  outputType: 'array' | 'stream' | undefined
) {
  const { filePath, format = getFileFormat(filePath) } = inputOptions;

  const state = new ConvertState();
  const stream = readCsv({
    // velocomp files have metadata on the first 4 lines
    fromLine: format === 'velocomp' ? 5 : 1,
    ...inputOptions,
  }).pipe(transform((record: any) => convertRecord(record, state)));

  return outputType === 'stream' ? stream : streamToArray(stream, 'timestamp');
}
