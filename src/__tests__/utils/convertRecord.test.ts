import { convertRecord, ConvertState } from '../../utils/server/convertRecord';
import { parse } from 'csv/sync';
import { getCsvParseOptions } from '../../utils/server/readCsv';

const fitSample = `
record.timestamp[s],record.position_lat[semicircles],record.position_long[semicircles],record.distance[m],record.accumulated_power[watts],record.altitude[m],record.speed[m/s],record.power[watts],record.unknown,record.heart_rate[bpm],record.temperature[C],record.enhanced_altitude[m],record.enhanced_speed[m/s],record.developer.0.Power2[W],record.developer.0.Cadence2[rpm],
"1015723923","560000000","-1450000000","18.12","126","126.79999999999995","3.863","17","620","113","9","126.79999999999995","3.863","60","35",
`.trim();

const velocompSample = `
Speed (km/hr),Wind Speed (km/hr),Power (W),Distance (km),Cadence (RPM),Heartrate (BPM),Elevation (meters),Hill slope (%),Temperature (degC),Lap Marker,Annotation,DFPM Power,Latitude,Longitude,Timestamp,Moving Time,CdA (m^2),Air Dens (kg/m^3)
8.2077,11.8404,0,0.046,0.001,117,41.4528,-1.4,8.8889,,,0,0,0,2022-03-09T01:31:28Z,10,0.2987,1.2453
`.trim();

const parseOptions = getCsvParseOptions();

function numbersToFixed(record: Record<string, any>, precision = 4) {
  for (const key of Object.keys(record)) {
    if (typeof record[key] === 'number') {
      record[key] = (record[key] as number).toFixed(precision);
    }
  }
  return record;
}

describe('convertRecord', () => {
  let state: ConvertState;

  beforeEach(() => {
    state = new ConvertState();
  });

  it('converts fit record', () => {
    const record = parse(fitSample, parseOptions)[0];
    const result = convertRecord(record, state);
    expect(numbersToFixed(result)).toMatchInlineSnapshot(`
      Object {
        "altitude (ft)": "416.0105",
        "cadence2 (rpm)": "35.0000",
        "distance (mi)": "0.0113",
        "duration": "00:00:00",
        "heart_rate (bpm)": "113.0000",
        "position_lat (deg)": "46.9387",
        "position_long (deg)": "-121.5376",
        "power (W)": "17.0000",
        "power2 (W)": "60.0000",
        "speed (mph)": "8.6413",
        "temperature (F)": "48.2000",
        "time": "17:32:03",
        "timestamp": "2022-03-09T01:32:03.000Z",
      }
    `);
  });

  it('converts velocomp record', () => {
    const record = parse(velocompSample, parseOptions)[0];
    const result = convertRecord(record, state);
    expect(numbersToFixed(result)).toMatchInlineSnapshot(`
      Object {
        "distance (mi)": "0.0286",
        "duration": "00:00:00",
        "elevation (ft)": "136.0000",
        "hill slope (%)": "-1.4000",
        "moving time": "10.0000",
        "power (W)": "0.0000",
        "speed (mph)": "5.1000",
        "temperature (F)": "48.0000",
        "time": "17:31:28",
        "timestamp": "2022-03-09T01:31:28Z",
        "wind speed (mph)": "7.3573",
      }
    `);
  });
});
