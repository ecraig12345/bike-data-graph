import { parse } from 'csv/sync';
import * as fs from 'fs';

const [tcxFile, csvFile] = process.argv.slice(2);

const tcxContent = fs.readFileSync(tcxFile, 'utf8');
const csvContent = fs.readFileSync(csvFile, 'utf8');

const csvData: Array<{ power_stages: string }> = parse(csvContent, {
  columns: true,
  skipEmptyLines: true,
});

let count = 0;
const newContent = tcxContent.replace(/<Watts>(\d+)<\/Watts>/g, (str, num) => {
  str = str.replace(num, csvData[count].power_stages);
  count++;
  return str;
});

fs.writeFileSync(tcxFile.replace('.tcx', '-new.tcx'), newContent);

// power_stages
