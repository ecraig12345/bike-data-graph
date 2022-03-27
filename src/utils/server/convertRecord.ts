import { ReadFileData } from '../../types';
import { convertField, getFieldDescriptionParts, maybeToNumber } from '../data/conversions';

export class ConvertState {
  warnedUnits = new Set<string>();
  warnedFields = new Set<string>();
  startTime = 0;
}

const ignoredFields = [
  // non-useful fit fields
  'record.accumulated_power[watts]',
  'record.unknown',
  // these are just wider int width of regular value (not relevant for bike data)
  'record.enhanced_altitude[m]',
  'record.enhanced_speed[m/s]',
  // ibike fields that aren't recorded properly due to feature lockdowns
  'Cadence (RPM)',
  'Heartrate (BPM)',
  'DFPM Power',
  'Latitude',
  'Longitude',
  // ibike fields that probably aren't useful
  'Lap Marker',
  'Annotation',
  'CdA (m^2)',
  'Air Dens (kg/m^3)',
];

export function convertRecord(record: Record<string, string>, state: ConvertState): ReadFileData {
  const { warnedFields, warnedUnits } = state;
  const data: Record<string, any> = {};

  Object.entries(record).forEach((entry, i) => {
    const field = entry[0].trim();
    const value = entry[1] || '0'; // interpret empty string as 0
    // Ignore empty field name (can happen due to column count mismatch)
    // or various fields that aren't useful or aren't recorded properly
    if (!field || ignoredFields.includes(field)) {
      return;
    }

    const [fieldName, units] = getFieldDescriptionParts(field);

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
        : fieldName.toLowerCase() +
          (convertedUnits || units ? ` (${convertedUnits || units})` : '');

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

    data[newFieldName] = convertedValue ?? maybeToNumber(value);

    // add time info unless this file was already converted
    if (newFieldName === 'timestamp' && !(record.time && record.duration)) {
      addTimeInfo(data, state);
    }
  });

  return data as ReadFileData;
}

function addTimeInfo(data: Record<string, any>, state: ConvertState) {
  if (!data.timestamp) {
    return;
  }

  const timestamp = new Date(data.timestamp);

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
