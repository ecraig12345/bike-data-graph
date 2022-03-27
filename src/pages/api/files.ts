// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs-extra';
import path from 'path';
import { dataRoot } from '../../utils/server/constants';
import { FilesData } from '../../types';

const absolute = (...segments: string[]) => path.join(dataRoot, ...segments);

/**
 * Read files from default root data directory.
 * Returns JSON on success or string error message on error.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FilesData | string>
) {
  if (!fs.existsSync(dataRoot)) {
    res.status(404).send(`"${dataRoot}" does not exist`);
    return;
  }

  const folders = fs
    .readdirSync(dataRoot)
    .filter((entry) => fs.statSync(absolute(entry)).isDirectory())
    .map((folder) => ({
      name: folder,
      // TODO: add .fit
      files: fs
        .readdirSync(absolute(folder))
        .filter((f) => /(?<!\.definitions|records)\.csv$/.test(f)),
    }));

  res.status(200).json(folders);
}
