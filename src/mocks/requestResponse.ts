import { NextApiRequest, NextApiResponse } from 'next';

/** very basic request mock */
export function mockRequest(values: Partial<Pick<NextApiRequest, 'body' | 'query'>> = {}) {
  return { ...values } as NextApiRequest;
}

export function mockResponse() {
  const res = {
    json: jest.fn(),
    send: jest.fn(),
    status: jest.fn().mockReturnThis(),
    getResult: () => ({
      json: res.json.mock.calls?.[0]?.[0],
      send: res.send.mock.calls?.[0]?.[0],
      status: res.status.mock.calls?.[0]?.[0],
    }),
  };

  return res as unknown as NextApiResponse & { getResult: typeof res.getResult };
}
