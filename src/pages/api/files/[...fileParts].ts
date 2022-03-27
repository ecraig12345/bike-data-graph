import fs from 'fs-extra';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { dataRoot } from '../../../utils/server/constants';
import { convert } from '../../../utils/server/convert';
import type { ReadFileData } from '../../../types';

export type ReadFileQuery = {
  fileParts: string[];
  format?: 'fit' | 'velocomp';
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReadFileData[] | string>
) {
  const { fileParts, format } = req.query as ReadFileQuery;

  const filePath = path.join(dataRoot, ...fileParts);

  if (!fs.existsSync(filePath)) {
    res.status(404).send(`"${filePath}" does not exist`);
    return;
  }

  try {
    const fileContent = await convert({ type: 'file' as const, filePath, format });

    res.status(200).json(fileContent);
  } catch (err) {
    console.error((err as Error).stack || err);
    res.status(400).send((err as Error).message || String(err));
  }
}
