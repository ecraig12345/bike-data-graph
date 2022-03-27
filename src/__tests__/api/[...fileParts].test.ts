import handler, { ReadFileQuery } from '../../pages/api/files/[...fileParts]';
import { mockRequest, mockResponse } from '../../mocks/requestResponse';
import { filePaths } from '../../mocks/filePaths';
import { ReadFileData } from '../../types';

describe('api/files/[...fileParts]', () => {
  it('errors on file not found', async () => {
    const query: ReadFileQuery = { fileParts: ['fake'] };
    const req = mockRequest({ query });
    const res = mockResponse();

    await handler(req, res);
    expect(res.status).toHaveBeenLastCalledWith(404);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect((res.send as jest.Mock).mock.calls[0][0]).toMatch(/does not exist/);
  });

  it('reads fit csv', async () => {
    const query: ReadFileQuery = { fileParts: filePaths.fromDataRoot(filePaths.fitCsv).split('/') };
    const req = mockRequest({ query });
    const res = mockResponse();

    await handler(req, res);
    expect(res.status).toHaveBeenLastCalledWith(200);
    expect(res.json).toHaveBeenCalledTimes(1);

    const result = (res.json as jest.Mock).mock.calls[0][0] as ReadFileData[];
    expect(result).toHaveLength(100);
    expect(Object.keys(result[0])).toEqual([
      'timestamp',
      'time',
      'duration',
      'position_lat (deg)',
      'position_long (deg)',
      'distance (mi)',
      'altitude (ft)',
      'speed (mph)',
      'power (W)',
      'heart_rate (bpm)',
      'temperature (F)',
      'power2 (W)',
      'cadence2 (rpm)',
    ]);
  });

  it('reads velocomp csv', async () => {
    const query: ReadFileQuery = {
      fileParts: filePaths.fromDataRoot(filePaths.velocompCsv).split('/'),
    };
    const req = mockRequest({ query });
    const res = mockResponse();

    await handler(req, res);
    expect(res.status).toHaveBeenLastCalledWith(200);
    expect(res.json).toHaveBeenCalledTimes(1);

    const result = (res.json as jest.Mock).mock.calls[0][0] as ReadFileData[];
    expect(result).toHaveLength(100);
    expect(Object.keys(result[0])).toEqual([
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

  it('reads and converts mystery csv', async () => {
    const query: ReadFileQuery = {
      fileParts: filePaths.fromDataRoot(filePaths.mysteryCsv).split('/'),
    };
    const req = mockRequest({ query });
    const res = mockResponse();

    await handler(req, res);
    expect(res.status).toHaveBeenLastCalledWith(200);
    expect(res.json).toHaveBeenCalledTimes(1);

    const result = (res.json as jest.Mock).mock.calls[0][0] as ReadFileData[];
    expect(result).toHaveLength(100);
    expect(result[0]).toEqual({
      date: '2021-09-09T05:08:40Z',
      num1: 88.9753,
      'num2 (ft)': 314.96064,
      something: 'lorem',
    });
  });

  it('reads converted csv', async () => {
    // This is a file that was originally fit format and has already been converted.
    // Just make sure it loads properly.
    const query: ReadFileQuery = {
      fileParts: filePaths.fromDataRoot(filePaths.convertedCsv).split('/'),
    };
    const req = mockRequest({ query });
    const res = mockResponse();

    await handler(req, res);
    expect(res.status).toHaveBeenLastCalledWith(200);
    expect(res.json).toHaveBeenCalledTimes(1);

    const result = (res.json as jest.Mock).mock.calls[0][0] as ReadFileData[];
    expect(result).toHaveLength(100);
    expect(Object.keys(result[0])).toEqual([
      'timestamp',
      'time',
      'duration',
      'position_lat (deg)',
      'position_long (deg)',
      'distance (mi)',
      'altitude (ft)',
      'speed (mph)',
      'power (W)',
      'heart_rate (bpm)',
      'temperature (F)',
      'power2 (W)',
      'cadence2 (rpm)',
    ]);
  });
});
