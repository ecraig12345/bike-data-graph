import { transform } from 'csv';
import type { Transformer } from 'stream-transform';
import { readCsvStream } from './readCsv';
import { streamToArray } from './streamToArray';
import { ConvertedFitData } from '../types';

const toNumber = (s: string) => Number(s);
// garmin timestamps use this weird offset
const offsetTime = new Date(1989, 11, 31).getTime();
const msInHour = 60 * 60 * 1000;
// and they're recorded in local time (JS Date needs UTC)
const utcOffset = -8 * msInHour;

const conversions: Record<string, (s: string, fieldName: string) => unknown> = {
  s: (s: string) => new Date(Number(s) * 1000 + offsetTime + utcOffset),
  semicircles: (s: string) => (Number(s) * 180) / Math.pow(2, 31),
  m: (s: string, fieldName: string) =>
    fieldName.includes('distance') ? Number(s) * 0.000621371 : Number(s) * 3.28084,
  'm/s': (s: string) => Number(s) * 2.23694,
  watts: toNumber,
  bpm: toNumber,
  C: (s: string) => (Number(s) * 9) / 5 + 32,
  W: toNumber,
  rpm: toNumber,
};

// record.timestamp[s]
// record.position_lat[semicircles]
// record.position_long[semicircles]
// record.distance[m]
// record.accumulated_power[watts]
// record.altitude[m]
// record.speed[m/s]
// record.power[watts]
// record.unknown
// record.heart_rate[bpm]
// record.temperature[C]
// record.enhanced_altitude[m]
// record.enhanced_speed[m/s]
// record.developer.0.Power2[W]
// record.developer.0.Cadence2[rpm]
// "enhanced" is irrelevant (wider int)

type State = {
  warnedUnits: Set<string>;
  warnedFields: Set<string>;
  startTime: number;
};

function transformRecord(record: Record<string, string>, state: State): ConvertedFitData {
  const { warnedFields, warnedUnits } = state;
  const data: Record<string, any> = {};

  Object.entries(record).forEach(([field, value], i) => {
    if (!field || field.startsWith('record.enhanced_')) {
      return; // ignore enhanced data, it's just wider int width of regular value
    }
    const match = field.trim().match(/^(?:record\.)?(developer\.\d+\.)?(\w+)(?:\[(.*?)\])?$/);
    if (!match) {
      if (!warnedFields.has(field)) {
        console.error(`could not determine field name: "${field}"`);
        warnedFields.add(field);
      }
      return;
    }

    let [, developer, fieldName, units] = match;
    fieldName = fieldName.replace(/^position_/, '');

    if (fieldName in data) {
      if (!warnedFields.has(fieldName)) {
        console.error(
          `found muliple values for field "${fieldName}"; will save as "${fieldName}_${i}"`
        );
        warnedFields.add(fieldName);
      }
      fieldName = `${fieldName}_${i}`;
    }

    if (!value) {
      data[fieldName] = value;
    } else if (units && conversions[units]) {
      data[fieldName] = conversions[units](value, fieldName);
    } else {
      if (units && !warnedUnits.has(units)) {
        console.error(`unknown units (will not convert): "${units}"`);
        warnedUnits.add(units);
      }
      data[fieldName] = value;
    }

    if (fieldName === 'timestamp') {
      const timestamp = data.timestamp as Date;
      if (!state.startTime) {
        state.startTime = timestamp.getTime() + utcOffset;
      }

      const format = '2-digit' as const;
      const options = { hour12: false, minute: format, second: format, hour: format };
      data.time = timestamp.toLocaleTimeString('en-US', options);
      data.duration = new Date(timestamp.getTime() - state.startTime)
        .toLocaleTimeString('en-US', options)
        .replace(/^24/, '00'); // what
    }
  });

  return data as ConvertedFitData;
}

export function convertStream(filePath: string): Transformer {
  const state: State = { warnedFields: new Set(), warnedUnits: new Set(), startTime: 0 };

  return readCsvStream(filePath).pipe(transform((record: any) => transformRecord(record, state)));
}

export async function convert(filePath: string): Promise<ConvertedFitData[]> {
  return streamToArray(convertStream(filePath));
}
