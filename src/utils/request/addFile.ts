import { FileInfo, ConvertFileBody, FileSettings } from '../../types';
import { useStore } from '../../store/useStore';
import { fetcher } from './fetcher';
import readFile from './readFile';

export type AddFileResponse = {
  /** file data and basic info */
  fileInfo: FileInfo;
  /** initial file mutable data, such as display name and timestamp field */
  fileMeta: FileSettings;
};

/**
 * Read and/or parse a CSV file using the server. Throws an exception on error.
 * @param file File path or object
 */
export async function addFile(file: string | File): Promise<AddFileResponse> {
  const filePath = typeof file === 'string' ? file : file.name;
  if (useStore.getState().files[filePath]) {
    throw new Error('This file (or one with the same name) was already loaded');
  }

  let csvData: string | undefined;
  if (typeof file !== 'string') {
    // this may throw if there's an error reading the file
    csvData = await readFile(file);
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
    throw new Error(`Error fetching data: ${err}`);
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
    throw new Error(`Error processing data: ${err}`);
  }
}
