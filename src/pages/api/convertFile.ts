import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { convert } from '../../utils/server/convert';
import { readCsv } from '../../utils/server/readCsv';
import { ConvertFileBody, ReadFileData } from '../../utils/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReadFileData | string>
) {
  let body: ConvertFileBody;
  try {
    body = JSON.parse(req.body);
    if (!body.csvData || !body.filePath) {
      throw 'bad request';
    }
  } catch (err) {
    res.status(400).send('Request body was not in expected JSON format');
    return;
  }

  const {
    filePath,
    csvData,
    convert: shouldConvert = path.basename(filePath).includes('records_data'),
  } = body;

  try {
    const inputOptions = { type: 'string' as const, data: csvData };
    const outputOptions = { type: 'array' as const, sortByField: 'timestamp' };
    const fileContent = shouldConvert
      ? await convert(inputOptions, outputOptions)
      : await readCsv(inputOptions, { ...outputOptions, convertNumbers: true });

    res.status(200).json(fileContent as ReadFileData);
  } catch (err) {
    console.error((err as Error).stack || err);
    res.status(400).send((err as Error).message || String(err));
  }
}
