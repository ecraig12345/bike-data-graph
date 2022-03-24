import { fetcher } from './fetcher';
import { Series, FileInfo } from './types';

export type FetchFileData = {
  /** file data and basic info */
  fileInfo: FileInfo;
  /** default series if fields with expected names are present (`timestamp`, `power*`) */
  series?: Series[];
};

export async function fetchFile(filePath: string): Promise<FetchFileData | { error: string }> {
  let rawData: FileInfo['rawData'];
  try {
    rawData = await fetcher(`api/files/${filePath}`);
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
      if (pathParts.length === 2 && pathParts[1].startsWith(pathParts[0])) {
        displayName = pathParts[1];
      }
    }

    const allFields = Object.keys(rawData[0]);
    Object.freeze(allFields);

    // if timestamp and power fields are available with expected names, add to graph
    const timeField = allFields.find((f) => f.toLowerCase() === 'timestamp');
    const graphFields = allFields.filter((f) => f.toLowerCase().startsWith('power'));
    let series: Series[] | undefined;
    if (timeField && graphFields.length) {
      // TODO ensure labels are unique
      series = graphFields.map((f) => ({ filePath, yField: f }));
    }

    return { fileInfo: { filePath, displayName, rawData, allFields, timeField }, series };
  } catch (err) {
    console.error('Error processing data', (err as Error).stack || err);
    return { error: `Error processing data: ${err}` };
  }
}
