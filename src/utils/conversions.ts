/** Garmin/FIT(?) timestamps are recorded with this weird offset */
const fitOffsetTime = new Date(1989, 11, 31).getTime();

/** Conversions from units found in FIT file to "standard" units */
const conversions: Record<
  string,
  (v: string, fieldName: string) => [value: string | number, units: string]
> = {
  s: (v) => {
    // For now, assume:
    // - weird garmin/fit(?) offset of Dec 31 1989
    // - date was recorded in local time (with DST offset at time of recording)
    const date = new Date(Number(v) * 1000 + fitOffsetTime);
    // positive if behind UTC, negative if ahead, e.g. UTC-8 => 480
    const utcOffsetMinutes = date.getTimezoneOffset();
    // correct for the date being recorded in local time
    date.setMinutes(date.getMinutes() - utcOffsetMinutes);
    return [date.toISOString(), 'date'];
  },
  semicircles: (v) => [(Number(v) * 180) / Math.pow(2, 31), 'deg'],
  m: (v, fieldName) =>
    fieldName.toLowerCase().includes('distance')
      ? [Number(v) * 0.000621371, 'mi'] // distance
      : [Number(v) * 3.28084, 'ft'], // probably altitude/elevation
  meters: (v) => [Number(v) * 3.28084, 'ft'],
  km: (v) => [Number(v) * 0.621371, 'mph'],
  'm/s': (v) => [Number(v) * 2.23694, 'mph'],
  'km/hr': (v) => [Number(v) * 0.621371, 'mph'],
  watts: (v) => [Number(v), 'W'],
  w: (v) => [Number(v), 'W'],
  bpm: (v) => [Number(v), 'bpm'],
  c: (v) => [(Number(v) * 9) / 5 + 32, 'F'],
  degc: (v) => [(Number(v) * 9) / 5 + 32, 'F'],
  rpm: (v) => [Number(v), 'rpm'],
  '%': (v) => [Number(v), '%'],
};

const fitFieldRegex = /^(?:record\.)?(developer\.\d+\.)?(\w+)(?:\[(.*?)\])?$/;
const velocompFieldRegex = /^([\w ]+)(?: \((.*?)\))?$/;

/**
 * Runs regex to match a field name as found in a records_data.csv files converted by the Fit SDK
 * OR in a .csv file saved from a velocomp/ibike file (PowerPod).
 *
 * Known fit fields (the `record.` prefix is optional in the regex):
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
 *
 * Known velocomp fields (some may be present but not recorded properly):
 * - `Speed (km/hr)`
 * - `Wind Speed (km/hr)`
 * - `Power (W)`
 * - `Distance (km)`
 * - `Elevation (meters)`
 * - `Hill slope (%)`
 * - `Temperature (degC)`
 * - `Timestamp`
 * - `Moving Time`
 * - `Cadence (RPM)`
 * - `Heartrate (BPM)`
 * - `Lap Marker`
 * - `Annotation`
 * - `DFPM Power`
 * - `Latitude`
 * - `Longitude`
 * - `CdA (m^2)`
 * - `Air Dens (kg/m^3)`
 */
export function getFieldDescriptionParts(
  fieldDescription: string
): [fieldName: string, units: string, developer: string] | undefined {
  fieldDescription = fieldDescription.trim();
  const fitMatch = fieldDescription.match(fitFieldRegex);
  const velocompMatch = fieldDescription.match(velocompFieldRegex);

  if (fitMatch) {
    const [, developer, fieldName, units] = fitMatch;
    return [fieldName, units, developer];
  }
  if (velocompMatch) {
    const [, fieldName, units] = velocompMatch;
    return [fieldName, units, ''];
  }
}

/**
 * Convert a value from units in the fit or ibike CSV file to "standard" units
 * @param fieldDescription Field description assumed to contain units in `[]` or `()`:
 * e.g. `some_field[units]` or `Some Field (units)`, OR array of field name and units
 * @param value Original value string
 * @returns Converted value and new units, or undefined if no conversion found
 */
export function convertField(
  field: string | [fieldName: string, units: string],
  value: string
): [value: number | string, units: string] | undefined {
  let [fieldName, units] = Array.isArray(field) ? field : getFieldDescriptionParts(field) || [];
  units = units?.toLowerCase();
  if (units && fieldName && conversions[units]) {
    return conversions[units](value, fieldName);
  }
  return undefined;
}
