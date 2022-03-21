// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs-extra';
import path from 'path';
import { dataRoot } from '../../utils/server/constants';
import { ApiResponse, FilesData } from '../../utils/types';

export type FilesResponse = ApiResponse<FilesData>;

const absolute = (...segments: string[]) => path.join(dataRoot, ...segments);

export default async function handler(req: NextApiRequest, res: NextApiResponse<FilesResponse>) {
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

  res.status(200).json({ data: folders });
}
