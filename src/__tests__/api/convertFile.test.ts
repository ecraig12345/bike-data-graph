import fs from 'fs-extra';
import path from 'path';
import handler from '../../pages/api/convertFile';
import { mockRequest, mockResponse } from '../../mocks/requestResponse';
import { filePaths } from '../../mocks/filePaths';
import { ConvertFileBody } from '../../types';

function getBody(filePath: string) {
  const csvData = fs.readFileSync(filePath, 'utf8');
  // from a file picker this would just get the basename
  const body: ConvertFileBody = { filePath: path.basename(filePath), csvData };
  return JSON.stringify(body);
}

describe('api/files/convertFile', () => {
  it('errors on missing body', async () => {
    const req = mockRequest();
    const res = mockResponse();

    await handler(req, res);
    const result = res.getResult();
    expect(result).toEqual({ status: 400, send: 'Request body was not in JSON format' });
  });

  it('errors on missing property', async () => {
    const req = mockRequest({ body: JSON.stringify({}) });
    const res = mockResponse();

    await handler(req, res);
    const result = res.getResult();
    expect(result).toEqual({ status: 400, send: 'Request body was missing csvData or filePath' });
  });

  it('errors on invalid body', async () => {
    const req = mockRequest({ body: 'not json' });
    const res = mockResponse();

    await handler(req, res);
    const result = res.getResult();
    expect(result).toEqual({ status: 400, send: 'Request body was not in JSON format' });
  });

  it('converts fit csv', async () => {
    const req = mockRequest({ body: getBody(filePaths.fitCsv) });
    const res = mockResponse();
    await handler(req, res);

    const result = res.getResult();
    expect(result).toEqual({ status: 200, json: expect.anything() });
    expect(result.json).toHaveLength(100);
    expect(Object.keys(result.json[0])).toEqual([
      'timestamp',
      'time',
      'duration',
      'lat (deg)',
      'long (deg)',
      'distance (mi)',
      'altitude (ft)',
      'speed (mph)',
      'power (W)',
      'heart rate (bpm)',
      'temperature (F)',
      'power2 (W)',
      'cadence2 (rpm)',
    ]);
  });

  it('converts velocomp csv', async () => {
    const req = mockRequest({ body: getBody(filePaths.velocompCsv) });
    const res = mockResponse();
    await handler(req, res);

    const result = res.getResult();
    expect(result).toEqual({ status: 200, json: expect.anything() });
    expect(result.json).toHaveLength(100);
    expect(Object.keys(result.json[0])).toEqual([
      'speed (mph)',
      'wind speed (mph)',
      'power (W)',
      'distance (mi)',
      'elevation (ft)',
      'hill slope (%)',
      'temperature (F)',
      'timestamp',
      'time',
      'duration',
      'moving time',
    ]);
  });

  it('converts mystery csv', async () => {
    const req = mockRequest({ body: getBody(filePaths.mysteryCsv) });
    const res = mockResponse();
    await handler(req, res);

    const result = res.getResult();
    expect(result).toEqual({ status: 200, json: expect.anything() });
    expect(result.json).toHaveLength(100);
    expect(result.json[0]).toEqual({
      date: '2021-09-09T05:08:40Z',
      num1: 88.9753,
      'num2 (ft)': 314.96064,
      something: 'lorem',
    });
  });

  it('handles converted csv', async () => {
    // This is a file that was originally fit format and has already been converted.
    // Just make sure it loads properly.
    const req = mockRequest({ body: getBody(filePaths.convertedCsv) });
    const res = mockResponse();
    await handler(req, res);

    const result = res.getResult();
    expect(result).toEqual({ status: 200, json: expect.anything() });
    expect(result.json).toHaveLength(100);
    expect(Object.keys(result.json[0])).toEqual([
      'timestamp',
      'time',
      'duration',
      'lat (deg)',
      'long (deg)',
      'distance (mi)',
      'altitude (ft)',
      'speed (mph)',
      'power (W)',
      'heart rate (bpm)',
      'temperature (F)',
      'power2 (W)',
      'cadence2 (rpm)',
    ]);
  });
});
