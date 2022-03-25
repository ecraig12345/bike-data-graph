import { convert } from '../../utils/server/convert';

const fitSample = `
record.timestamp[s],record.position_lat[semicircles],record.position_long[semicircles],record.distance[m],record.accumulated_power[watts],record.altitude[m],record.speed[m/s],record.power[watts],record.unknown,record.heart_rate[bpm],record.temperature[C],record.enhanced_altitude[m],record.enhanced_speed[m/s],record.developer.0.Power2[W],record.developer.0.Cadence2[rpm],
"1015723923","560000000","-1450000000","18.12","126","126.79999999999995","3.863","17","620","113","9","126.79999999999995","3.863","60","35",
"1015723939","560000000","-1450000000","97.67","290","125.39999999999998","6.242","15","2559","111","9","125.39999999999998","6.242","51","77"
"1015724026","560000000","-1450000000","542.9","2186","118.0","4.6","0","2439","108","8","118.0","4.6","0","0",
`.trim();

const velocompSample = `
Speed (km/hr),Wind Speed (km/hr),Power (W),Distance (km),Cadence (RPM),Heartrate (BPM),Elevation (meters),Hill slope (%),Temperature (degC),Lap Marker,Annotation,DFPM Power,Latitude,Longitude,Timestamp,Moving Time,CdA (m^2),Air Dens (kg/m^3)
8.2077,11.8404,0,0.046,0.001,117,41.4528,-1.4,8.8889,,,0,0,0,2022-03-09T01:31:28Z,10,0.2987,1.2453
7.403,12.4188,74,0.1163,0.001,114,42.3672,4.4,8.8889,,,0,0,0,2022-03-09T01:33:04Z,37,0.2987,1.2452
24.9448,19.405,0,2.0699,0,126,14.0208,-3.3,8.3333,,,0,0,0,2022-03-09T01:38:27Z,351,0.2987,1.2519
`.trim();

describe('convert', () => {
  // Conversion of individual records was tested in convertRecord.test.ts.
  // These tests just verify that the addition of time data is correct.

  it('adds time fields to fit record', async () => {
    // note, the demo records aren't continuous
    const result = await convert({ type: 'string', data: fitSample, filePath: '' });

    expect(result[0].timestamp).toBe('2022-03-09T01:32:03.000Z');
    expect(result[1].timestamp).toBe('2022-03-09T01:32:19.000Z');
    expect(result[2].timestamp).toBe('2022-03-09T01:33:46.000Z');

    expect(result[0].duration).toBe('00:00:00');
    expect(result[1].duration).toBe('00:00:16');
    expect(result[2].duration).toBe('00:01:43');

    // good luck on switching time zones
    expect(result[0].time).toBe('17:32:03');
    expect(result[1].time).toBe('17:32:19');
    expect(result[2].time).toBe('17:33:46');
  });

  it('adds time fields to velocomp record', async () => {
    const result = await convert({ type: 'string', data: velocompSample, filePath: '' });

    // timestamp is saved properly in the original file
    expect(result[0].timestamp).toBe('2022-03-09T01:31:28Z');
    expect(result[1].timestamp).toBe('2022-03-09T01:33:04Z');
    expect(result[2].timestamp).toBe('2022-03-09T01:38:27Z');

    // duration and time are added
    expect(result[0].duration).toBe('00:00:00');
    expect(result[1].duration).toBe('00:01:36');
    expect(result[2].duration).toBe('00:06:59');

    expect(result[0].time).toBe('17:31:28');
    expect(result[1].time).toBe('17:33:04');
    expect(result[2].time).toBe('17:38:27');
  });
});
