import fs from 'fs-extra';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { dataRoot } from '../../../utils/server/constants';
import { convert } from '../../../utils/server/convert';
import type { ReadFileData } from '../../../utils/types';
import { readCsv } from '../../../utils/server/readCsv';

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
    const fileContent = shouldConvert
      ? await convert(filePath, 'timestamp')
      : await readCsv(filePath, true, 'timestamp');

    res.status(200).json(fileContent as ReadFileData);
  } catch (err) {
    console.error((err as Error).stack || err);
    res.status(400).send((err as Error).message || String(err));
  }
}
