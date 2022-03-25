import { finished as streamFinished } from 'stream';
import type { Transformer } from 'stream-transform';
import { promisify } from 'util';

const finished = promisify(streamFinished);

function sortBy(data: any[], sortByField: string) {
  return data.sort((a, b) => {
    const aVal = a[sortByField];
    const bVal = b[sortByField];
    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
  });
}

export async function streamToArray<T>(stream: Transformer, sortByField?: string): Promise<T[]> {
  const data: T[] = [];
  for await (const record of stream) {
    data.push(record);
  }
  await finished(stream);

  if (sortByField && data.length && (data[0] as any)[sortByField]) {
    return sortBy(data as any[], sortByField);
  }

  return data;
}
