import fs from 'fs-extra';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { dataRoot } from '../../../utils/server/constants';
import { convert } from '../../../utils/server/convert';
import { readCsv } from '../../../utils/server/readCsv';
import type { ReadFileData } from '../../../utils/types';

export type ReadFileQuery = {
  fileParts: string[];
  convert?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReadFileData | string>
) {
  const { fileParts, convert: convertParam } = req.query as ReadFileQuery;

  const filePath = path.join(dataRoot, ...fileParts);

  if (!fs.existsSync(filePath)) {
    res.status(404).send(`"${filePath}" does not exist`);
    return;
  }

  const shouldConvert = convertParam
    ? !/^(false|no|0)$/i.test(convertParam)
    : path.basename(filePath).includes('records_data');

  try {
    const inputOptions = { type: 'file' as const, filePath };
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
