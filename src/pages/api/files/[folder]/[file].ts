import fs from 'fs-extra';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { dataRoot } from '../../../../utils/server/constants';
import { convert } from '../../../../utils/server/convert';
import type { ApiResponse, ReadFileData } from '../../../../utils/types';
import { readCsv } from '../../../../utils/server/readCsv';

export type ReadFileQuery = {
  file: string;
  folder: string;
  convert?: string;
};

export type ReadFileResponse = ApiResponse<ReadFileData>;

export default async function handler(req: NextApiRequest, res: NextApiResponse<ReadFileResponse>) {
  const { file, folder, convert: convertParam } = req.query as ReadFileQuery;
  if (!file || !folder) {
    res.status(400).send({ error: 'missing file and/or folder params' });
    return;
  }

  const shouldConvert = convertParam
    ? !/^(false|no|0)$/i.test(convertParam)
    : file.includes('records_data');

  const filePath = path.join(dataRoot, folder, file);
  if (!fs.existsSync(filePath)) {
    res.status(404).send({ error: `"${filePath}" does not exist` });
  }

  try {
    const fileContent = shouldConvert
      ? await convert(filePath, 'timestamp')
      : await readCsv(filePath, true, 'timestamp');

    res.status(200).json({ data: fileContent as ReadFileData });
  } catch (err) {
    console.error((err as Error).stack || err);
    res.status(400).send({ error: (err as Error).message || String(err) });
  }
}
