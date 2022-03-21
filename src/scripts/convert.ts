import { stringify } from 'csv';
import { Options as StringifyOptions } from 'csv-stringify';
// import { parse as parseSync } from 'csv/sync';
import * as fs from 'fs';
import { convert, convertStream } from '../utils/server/convert';

// generate({ seed: 1, length: 20, columns: ['ascii', 'int'] });

const [inFile, outFile] = process.argv.slice(2);
const outStream = outFile ? fs.createWriteStream(outFile) : process.stdout;

async function run() {
  const data = await convert(inFile);
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}
// run();

convertStream(inFile)
  .pipe(
    stringify({
      header: true,
      columns: [
        'timestamp',
        'time',
        'duration',
        'lat',
        'long',
        'distance',
        'altitude',
        'speed',
        'Cadence2',
        'heart_rate',
        { key: 'power', header: 'power_powerpod' },
        { key: 'Power2', header: 'power_stages' },
      ] as StringifyOptions['columns'],
    })
  )
  .pipe(outStream);
