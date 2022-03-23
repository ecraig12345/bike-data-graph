/** Garmin/FIT(?) timestamps are recorded with this weird offset */
const fitOffsetTime = new Date(1989, 11, 31).getTime();

/** Conversions from units found in FIT file to "standard" units */
const conversions: Record<
  string,
  (v: string, fieldName: string) => [value: Date | number, units: string]
> = {
  s: (v: string) => {
    // For now, assume:
    // - weird garmin/fit(?) offset of Dec 31 1989
    // - date was recorded in local time (with DST offset at time of recording)
    const date = new Date(Number(v) * 1000 + fitOffsetTime);
    // positive if behind UTC, negative if ahead, e.g. UTC-8 => 480
    const utcOffsetMinutes = date.getTimezoneOffset();
    // correct for the date being recorded in local time
    date.setMinutes(date.getMinutes() - utcOffsetMinutes);
    return [date, 'date'];
  },
  semicircles: (v: string) => [(Number(v) * 180) / Math.pow(2, 31), 'deg'],
  m: (v: string, fieldName: string) =>
    fieldName.toLowerCase().includes('distance')
      ? [Number(v) * 0.000621371, 'mi'] // distance
      : [Number(v) * 3.28084, 'ft'], // probably altitude/elevation
  'm/s': (v: string) => [Number(v) * 2.23694, 'mph'],
  watts: (v: string) => [Number(v), 'W'],
  w: (v: string) => [Number(v), 'W'],
  bpm: (v: string) => [Number(v), 'bpm'],
  c: (v: string) => [(Number(v) * 9) / 5 + 32, 'F'],
  rpm: (v: string) => [Number(v), 'rpm'],
};

/**
 * Runs regex to match a field name as found in records_data.csv files converted by the Fit SDK.
 * Known fields (the `record.` prefix is optional in the regex):
 * - `record.timestamp[s]`
 * - `record.position_lat[semicircles]`
 * - `record.position_long[semicircles]`
 * - `record.distance[m]`
 * - `record.accumulated_power[watts]`
 * - `record.altitude[m]`
 * - `record.speed[m/s]`
 * - `record.power[watts]`
 * - `record.unknown`
 * - `record.heart_rate[bpm]`
 * - `record.temperature[C]`
 * - `record.enhanced_altitude[m]`
 * - `record.enhanced_speed[m/s]`
 * - `record.developer.0.Power2[W]`
 * - `record.developer.0.Cadence2[rpm]`
 * - "enhanced" fields are irrelevant (wider int which shouldn't be needed for bike data)
 */
export function getFieldDescriptionParts(
  fieldDescription: string
): [fieldName: string, units: string, developer: string] | undefined {
  const [, developer, fieldName, units] =
    fieldDescription.trim().match(/^(?:record\.)?(developer\.\d+\.)?(\w+)(?:\[(.*?)\])?$/) || [];
  return [fieldName, units, developer];
}

/**
 * Convert a value from units in the FIT file to "standard" units
 * @param fieldDescription Field description assumed to contain units in `[]`:
 * e.g. `some_field[units]`, OR array of field name and units
 * @param value Original value string
 * @returns Converted value and new units, or undefined if no conversion found
 */
export function convertField(
  field: string | [fieldName: string, units: string],
  value: string
): [value: number | Date, units: string] | undefined {
  let [fieldName, units] = Array.isArray(field) ? field : getFieldDescriptionParts(field) || [];
  units = units?.toLowerCase();
  if (units && fieldName && conversions[units]) {
    return conversions[units](value, fieldName);
  }
  return undefined;
}
