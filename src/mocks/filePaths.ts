import path from 'path';

const dataRoot = path.resolve(__dirname, '../../data');

export const filePaths = {
  fitCsv: path.join(__dirname, 'mock.records_data.csv'),
  velocompCsv: path.join(__dirname, 'Velocomp_mock.csv'),
  /** random data */
  mysteryCsv: path.join(__dirname, 'mystery.csv'),
  convertedCsv: path.join(__dirname, 'converted.csv'),
  dataRoot,
  fromDataRoot: (p: string) => path.relative(dataRoot, p),
};
