import { finished as streamFinished } from 'stream';
import type { Transformer } from 'stream-transform';
import { promisify } from 'util';

const finished = promisify(streamFinished);

export async function streamToArray<T>(stream: Transformer): Promise<T[]> {
  const data: T[] = [];
  for await (const record of stream) {
    data.push(record);
  }
  await finished(stream);

  return data;
}
