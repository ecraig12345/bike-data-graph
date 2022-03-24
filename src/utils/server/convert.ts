import { transform } from 'csv';
import type { Transformer } from 'stream-transform';
import { CsvInputOptions, readCsv } from './readCsv';
import { streamToArray } from './streamToArray';
import { ConvertedFitData, ReadFileData } from '../types';
import { convertField, getFieldDescriptionParts } from '../conversions';

type State = {
  warnedUnits: Set<string>;
  warnedFields: Set<string>;
  startTime: number;
};

function addTimeInfo(data: Record<string, any>, state: State) {
  const timestamp = data.timestamp as Date;
  if (!state.startTime) {
    const startDate = new Date(timestamp);
    startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
    state.startTime = startDate.getTime();
  }

  const format = '2-digit' as const;
  const options = { hour12: false, minute: format, second: format, hour: format };
  data.time = timestamp.toLocaleTimeString('en-US', options);
  data.duration = new Date(timestamp.getTime() - state.startTime)
    .toLocaleTimeString('en-US', options)
    .replace(/^24/, '00'); // what
}

function transformRecord(record: Record<string, string>, state: State): ConvertedFitData {
  const { warnedFields, warnedUnits } = state;
  const data: Record<string, any> = {};

  Object.entries(record).forEach((entry, i) => {
    const field = entry[0];
    const value = entry[1] || '0'; // interpret empty string as 0
    // Ignore:
    // - empty field name: can happen due to column count mismatch
    // - "enhanced" data: it's just wider int width of regular value (not relevant for bike data)
    // - accumulated power: how is this useful?
    if (!field || field.startsWith('record.enhanced_') || field.includes('accumulated_power')) {
      return;
    }

    let [fieldName, units = ''] = getFieldDescriptionParts(field) || [];
    if (!fieldName) {
      if (!warnedFields.has(field)) {
        console.error(`could not determine field name: "${field}"`);
        warnedFields.add(field);
      }
      return;
    }

    const [convertedValue, convertedUnits = ''] =
      convertField([fieldName, units], value || '0') || [];

    if (units && !convertedUnits && !warnedUnits.has(units)) {
      console.warn(`unknown units (will not convert): "${units}"`);
      warnedUnits.add(units);
    }

    // add converted units to the final field name (except timestamp, we'll modify that more later)
    let newFieldName =
      fieldName === 'timestamp'
        ? 'timestamp'
        : fieldName.toLowerCase() + (convertedUnits || units ? `[${convertedUnits || units}]` : '');

    if (newFieldName in data) {
      // already found a value for this field--rename it
      const modifiedFieldName = newFieldName.replace(fieldName, `${fieldName}_${i}`);
      if (!warnedFields.has(newFieldName)) {
        console.error(
          `found muliple values for field "${newFieldName}" (from original "${field}"); ` +
            `will save as "${modifiedFieldName}"`
        );
        warnedFields.add(newFieldName);
      }
      newFieldName = modifiedFieldName;
    }

    data[newFieldName] = convertedValue ?? value;

    if (fieldName === 'timestamp') {
      addTimeInfo(data, state);
    }
  });

  return data as ConvertedFitData;
}

export function convertStream(stream: Transformer) {
  const state: State = { warnedFields: new Set(), warnedUnits: new Set(), startTime: 0 };
  return stream.pipe(transform((record: any) => transformRecord(record, state)));
}

export type ConvertOutputOptionsSteam = { type: 'stream' };
export type ConvertOutputOptionsArray = { type: 'array'; sortByField?: string };

/**
 * Convert CSV data from the records_data format generated by the FIT SDK's conversion tool
 * and return the records.
 * @param inputOptions If `inputOptions.type` is `file`, read from the file path and parse/convert.
 * If it's `string`, just parse/convert the given data.
 * @param outputOptions If `outputOptions.type` is `stream`, return a stream of record objects.
 * If it's `array`, return an array of record objects.
 */
export function convert(
  inputOptions: CsvInputOptions,
  outputOptions: ConvertOutputOptionsArray
): Promise<ReadFileData[]>;
export function convert(
  inputOptions: CsvInputOptions,
  outputOptions: ConvertOutputOptionsSteam
): Transformer;
export function convert(
  inputOptions: CsvInputOptions,
  outputOptions: ConvertOutputOptionsArray | ConvertOutputOptionsSteam
) {
  const state: State = { warnedFields: new Set(), warnedUnits: new Set(), startTime: 0 };
  const stream = readCsv(inputOptions, { type: 'stream' }).pipe(
    transform((record: any) => transformRecord(record, state))
  );

  return outputOptions.type === 'stream'
    ? stream
    : streamToArray(stream, outputOptions.sortByField);
}
