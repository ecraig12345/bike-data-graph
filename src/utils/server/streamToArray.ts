import { finished as streamFinished } from 'stream';
import type { Transformer } from 'stream-transform';
import { promisify } from 'util';
import sortBy from 'lodash-es/sortBy';

const finished = promisify(streamFinished);

export async function streamToArray<T>(stream: Transformer, sortByField?: string): Promise<T[]> {
  const data: T[] = [];
  for await (const record of stream) {
    data.push(record);
  }
  await finished(stream);

  if (sortByField && (data[0] as any)[sortByField]) {
    return sortBy(data as any[], sortByField);
  }

  return data;
}
