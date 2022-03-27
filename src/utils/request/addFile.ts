import { fetcher } from './fetcher';
import { FileInfo, ConvertFileBody, FileSettings } from '../../types';
import { useStore } from '../../store/useStore';

export type AddFileResponse = {
  /** file data and basic info */
  fileInfo: FileInfo;
  /** initial file mutable data, such as display name and timestamp field */
  fileMeta: FileSettings;
};

/**
 * Read and/or parse a CSV file using the server.
 * @param filePath File path, usually to read from
 * @param csvData CSV data if the file was already loaded via drag/drop
 */
export async function addFile(
  filePath: string,
  csvData?: string
): Promise<AddFileResponse | { error: string }> {
  if (useStore.getState().files[filePath]) {
    return { error: 'This file (or one with the same name) was already loaded' };
  }

  let rawData: FileInfo['rawData'];
  try {
    if (csvData) {
      const body: ConvertFileBody = { filePath, csvData };
      rawData = await fetcher(`api/convertFile`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } else {
      rawData = await fetcher(`api/files/${filePath}`);
    }
  } catch (err) {
    return { error: `Error fetching data: ${err}` };
  }

  try {
    // pre-freeze per https://immerjs.github.io/immer/performance/#pre-freeze-data
    Object.freeze(rawData);

    // use filename as initial display name (removing redundant folder name if present)
    let displayName = filePath.replace(/\\/g, '/');
    if (displayName.includes('/')) {
      const pathParts = displayName.split('/');
      if (
        pathParts.length === 2 &&
        pathParts[1].toLowerCase().startsWith(pathParts[0].toLowerCase())
      ) {
        displayName = pathParts[1];
      }
    }

    const allFields = Object.keys(rawData[0]);
    Object.freeze(allFields);

    const timeField = allFields.find((f) => f.toLowerCase() === 'timestamp');

    return {
      fileInfo: { filePath, rawData, allFields },
      fileMeta: { displayName, timeField },
    };
  } catch (err) {
    console.error('Error processing data', (err as Error).stack || err);
    return { error: `Error processing data: ${err}` };
  }
}
