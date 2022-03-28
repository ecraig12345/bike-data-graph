import path from 'path';
import { dataRoot } from '../utils/server/constants';

export const filePaths = {
  fitCsv: path.join(__dirname, 'mock.records_data.csv'),
  velocompCsv: path.join(__dirname, 'Velocomp_mock.csv'),
  /** random data */
  mysteryCsv: path.join(__dirname, 'mystery.csv'),
  convertedCsv: path.join(__dirname, 'converted.csv'),
  fromDataRoot: (p: string) => path.relative(dataRoot, p),
};
