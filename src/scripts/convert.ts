import { stringify } from 'csv';
import { Options as StringifyOptions } from 'csv-stringify';
import fs from 'fs';
import { convert, convertStream } from '../utils/server/convert';

const args = process.argv.slice(2);
let limit: number | undefined;
if (args[0] === '--limit') {
  args.shift();
  limit = Number(args.shift());
}
const inFile = args.shift()!;
const outFile = args.shift();
const outStream = outFile ? fs.createWriteStream(outFile) : process.stdout;

async function run() {
  const data = await convert(inFile);
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}
// run();

convertStream(inFile, limit)
  .pipe(
    stringify({
      header: true,
      columns: [
        'timestamp',
        'time',
        'duration',
        'position_lat[deg]',
        'position_long[deg]',
        'distance[mi]',
        'altitude[ft]',
        'speed[mph]',
        'cadence[rpm]',
        'cadence2[rpm]',
        'heart_rate[bpm]',
        'power[W]',
        'power2[W]',
        // { key: 'power', header: 'power_powerpod' },
        // { key: 'Power2', header: 'power_stages' },
      ] as StringifyOptions['columns'],
    })
  )
  .pipe(outStream);
