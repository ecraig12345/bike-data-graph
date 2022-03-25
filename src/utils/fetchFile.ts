import { fetcher } from './fetcher';
import { FileInfo, ConvertFileBody, SeriesId } from './types';

export type FetchFileResponse = {
  /** file data and basic info */
  fileInfo: FileInfo;
  /** timestamp field name, if field with the default expected name was present */
  timeField?: string;
  /** default series if fields with expected names are present (`timestamp`, `power*`) */
  series?: SeriesId[];
};

/**
 * Read and/or parse a CSV file using the server.
 * @param filePath File path, usually to read from
 * @param csvData CSV data if the file was already loaded via drag/drop
 */
export async function fetchFile(
  filePath: string,
  csvData?: string
): Promise<FetchFileResponse | { error: string }> {
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
      if (pathParts.length === 2 && pathParts[1].startsWith(pathParts[0])) {
        displayName = pathParts[1];
      }
    }

    const allFields = Object.keys(rawData[0]);
    Object.freeze(allFields);

    // if timestamp and power fields are available with expected names, add to graph
    const timeField = allFields.find((f) => f.toLowerCase() === 'timestamp');
    const graphFields = allFields.filter((f) => f.toLowerCase().startsWith('power'));
    let series: SeriesId[] | undefined;
    if (timeField && graphFields.length) {
      // TODO ensure labels are unique
      series = graphFields.map((f) => ({ filePath, yField: f }));
    }

    return { fileInfo: { filePath, displayName, rawData, allFields }, timeField, series };
  } catch (err) {
    console.error('Error processing data', (err as Error).stack || err);
    return { error: `Error processing data: ${err}` };
  }
}
