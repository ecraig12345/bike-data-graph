import { convertField, getFieldDescriptionParts } from '../../utils/server/conversions';

const knownFields = [
  'record.timestamp[s]',
  'record.position_lat[semicircles]',
  'record.position_long[semicircles]',
  'record.distance[m]',
  'record.accumulated_power[watts]',
  'record.altitude[m]',
  'record.speed[m/s]',
  'record.power[watts]',
  'record.unknown',
  'record.heart_rate[bpm]',
  'record.temperature[C]',
  'record.enhanced_altitude[m]',
  'record.enhanced_speed[m/s]',
  'record.developer.0.Power2[W]',
  'record.developer.0.Cadence2[rpm]',
  'Speed (km/hr)',
  'Wind Speed (km/hr)',
  'Power (W)',
  'Distance (km)',
  'Elevation (meters)',
  'Hill slope (%)',
  'Temperature (degC)',
  'Timestamp',
  'Moving Time',
  'Cadence (RPM)',
  'Heartrate (BPM)',
  'Lap Marker',
  'Annotation',
  'DFPM Power',
  'Latitude',
  'Longitude',
  'CdA (m^2)',
  'Air Dens (kg/m^3)',
];

describe('getFieldDescriptionParts', () => {
  it('returns parts of fit field', () => {
    expect(getFieldDescriptionParts('record.developer.0.Power2[W]')).toEqual([
      'Power2',
      'W',
      'developer.0.',
    ]);
    expect(getFieldDescriptionParts('record.speed[m/s]')).toEqual(['speed', 'm/s', '']);
    expect(getFieldDescriptionParts('record.unknown')).toEqual(['unknown', '', '']);
  });

  it('returns parts of velocomp field', () => {
    expect(getFieldDescriptionParts('Air Dens (kg/m^3)')).toEqual(['Air Dens', 'kg/m^3', '']);
    expect(getFieldDescriptionParts('Moving Time')).toEqual(['Moving Time', '', '']);
  });

  it('returns original field for weird input', () => {
    expect(getFieldDescriptionParts('#$@35@#%dsf2')).toEqual(['#$@35@#%dsf2', '', '']);
  });

  it('recognizes known fields', () => {
    // This is intended as a way to visually verify that known fields' parsing is initially sensible
    // and doesn't change. Most of the code is essentially a custom snapshot serializer.
    const descriptions = knownFields.map((f) => {
      let res = `'${f}'`.padEnd(35);
      const parts = getFieldDescriptionParts(f);
      if (parts) {
        res += [`'${parts[0]}'`.padEnd(19), `'${parts[1]}'`.padEnd(13), `'${parts[2]}'`].join(' ');
      }
      return res;
    });
    expect(descriptions).toMatchInlineSnapshot(`
      Array [
        "'record.timestamp[s]'              'timestamp'         's'           ''",
        "'record.position_lat[semicircles]' 'position_lat'      'semicircles' ''",
        "'record.position_long[semicircles]''position_long'     'semicircles' ''",
        "'record.distance[m]'               'distance'          'm'           ''",
        "'record.accumulated_power[watts]'  'accumulated_power' 'watts'       ''",
        "'record.altitude[m]'               'altitude'          'm'           ''",
        "'record.speed[m/s]'                'speed'             'm/s'         ''",
        "'record.power[watts]'              'power'             'watts'       ''",
        "'record.unknown'                   'unknown'           ''            ''",
        "'record.heart_rate[bpm]'           'heart_rate'        'bpm'         ''",
        "'record.temperature[C]'            'temperature'       'C'           ''",
        "'record.enhanced_altitude[m]'      'enhanced_altitude' 'm'           ''",
        "'record.enhanced_speed[m/s]'       'enhanced_speed'    'm/s'         ''",
        "'record.developer.0.Power2[W]'     'Power2'            'W'           'developer.0.'",
        "'record.developer.0.Cadence2[rpm]' 'Cadence2'          'rpm'         'developer.0.'",
        "'Speed (km/hr)'                    'Speed'             'km/hr'       ''",
        "'Wind Speed (km/hr)'               'Wind Speed'        'km/hr'       ''",
        "'Power (W)'                        'Power'             'W'           ''",
        "'Distance (km)'                    'Distance'          'km'          ''",
        "'Elevation (meters)'               'Elevation'         'meters'      ''",
        "'Hill slope (%)'                   'Hill slope'        '%'           ''",
        "'Temperature (degC)'               'Temperature'       'degC'        ''",
        "'Timestamp'                        'Timestamp'         ''            ''",
        "'Moving Time'                      'Moving Time'       ''            ''",
        "'Cadence (RPM)'                    'Cadence'           'RPM'         ''",
        "'Heartrate (BPM)'                  'Heartrate'         'BPM'         ''",
        "'Lap Marker'                       'Lap Marker'        ''            ''",
        "'Annotation'                       'Annotation'        ''            ''",
        "'DFPM Power'                       'DFPM Power'        ''            ''",
        "'Latitude'                         'Latitude'          ''            ''",
        "'Longitude'                        'Longitude'         ''            ''",
        "'CdA (m^2)'                        'CdA'               'm^2'         ''",
        "'Air Dens (kg/m^3)'                'Air Dens'          'kg/m^3'      ''",
      ]
    `);
  });
});

describe('convertField', () => {
  it('returns undefined for unknown units', () => {
    expect(convertField('thing', '100')).toBeUndefined();
    expect(convertField(['thing', ''], '100')).toBeUndefined();
    expect(convertField(['thing', 'stuff'], '100')).toBeUndefined();
  });

  it('converts with field string', () => {
    // intentionally use things that just convert to numbers at first
    // (also this tests conversions using lowercase)
    expect(convertField('record.heart_rate[bpm]', '100')).toEqual([100, 'bpm']);
    expect(convertField('Heartrate (BPM)', '100')).toEqual([100, 'bpm']);
  });

  it('converts with field array', () => {
    expect(convertField(['heart_rate', 'bpm'], '100')).toEqual([100, 'bpm']);
    expect(convertField(['Heartrate', 'BPM'], '100')).toEqual([100, 'bpm']);
  });

  it('converts altitude in m to ft', () => {
    let [value, units] = convertField('record.altitude[m]', '120.0') || [];
    expect(value).toBeCloseTo(393.7);
    expect(units).toBe('ft');
  });

  it('converts distance in m to mi', () => {
    let [value, units] = convertField('record.distance[m]', '363.84') || [];
    expect(value).toBeCloseTo(0.226);
    expect(units).toBe('mi');
  });

  it('converts fit timestamp to proper date', () => {
    // timestamps are NOT unix epoch seconds
    expect(convertField('record.timestamp[s]', '1015723983')).toEqual([
      '2022-03-09T01:33:03.000Z',
      'date',
    ]);
  });

  it('converts to numbers', () => {
    expect(convertField('record.developer.0.Cadence2[rpm]', '100')).toEqual([100, 'rpm']);
    expect(convertField('record.developer.0.Power2[W]', '100')).toEqual([100, 'W']);
    expect(convertField('record.heart_rate[bpm]', '100')).toEqual([100, 'bpm']);
    expect(convertField('record.power[watts]', '100')).toEqual([100, 'W']);

    expect(convertField('Cadence (RPM)', '100')).toEqual([100, 'rpm']);
    expect(convertField('Heartrate (BPM)', '100')).toEqual([100, 'bpm']);
    expect(convertField('Hill slope (%)', '-3')).toEqual([-3, '%']);
    expect(convertField('Power (W)', '100')).toEqual([100, 'W']);
  });

  // everything else
  it('does more conversions', () => {
    let [value, units] = convertField('record.position_lat[semicircles]', '560000000') || [];
    expect(value).toBeCloseTo(46.9386577606, 10); // verify high precision of lat/long
    expect(units).toBe('deg');

    [value, units] = convertField('record.speed[m/s]', '1.829') || [];
    expect(value).toBeCloseTo(4.09);
    expect(units).toBe('mph');

    [value, units] = convertField('record.temperature[C]', '9') || [];
    expect(value).toBeCloseTo(48.2);
    expect(units).toBe('F');

    [value, units] = convertField('Distance (km)', '0.0481') || [];
    expect(value).toBeCloseTo(0.029887, 4);
    expect(units).toBe('mi');

    [value, units] = convertField('Elevation (meters)', '41.148') || [];
    expect(value).toBeCloseTo(135);
    expect(units).toBe('ft');

    [value, units] = convertField('Speed (km/hr)', '7.5639') || [];
    expect(value).toBeCloseTo(4.699);
    expect(units).toBe('mph');

    [value, units] = convertField('Temperature (degC)', '8.8889') || [];
    expect(value).toBeCloseTo(48);
    expect(units).toBe('F');

    [value, units] = convertField('Wind Speed (km/hr)', '11.2328') || [];
    expect(value).toBeCloseTo(6.979);
    expect(units).toBe('mph');
  });
});
