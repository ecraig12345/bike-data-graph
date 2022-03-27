import type { NextApiRequest, NextApiResponse } from 'next';
import { convert } from '../../utils/server/convert';
import { ConvertFileBody, ReadFileData } from '../../utils/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReadFileData[] | string>
) {
  let body: ConvertFileBody;
  try {
    body = JSON.parse(req.body);
  } catch (err) {
    res.status(400).send('Request body was not in JSON format');
    return;
  }
  if (!body.csvData || !body.filePath) {
    res.status(400).send('Request body was missing csvData or filePath');
    return;
  }

  const { filePath, csvData } = body;

  try {
    const fileContent = await convert({ type: 'string' as const, filePath, data: csvData });

    res.status(200).json(fileContent);
  } catch (err) {
    console.error((err as Error).stack || err);
    res.status(400).send((err as Error).message || String(err));
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '16mb',
    },
  },
};
