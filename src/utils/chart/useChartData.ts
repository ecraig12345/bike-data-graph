import React from 'react';
import { fetcher } from '../fetcher';
import { ReadFileData } from '../types';

export type RawChartData = {
  data?: ReadFileData;
  fields?: string[];
  error?: string;
};

type FetchFileResult = Omit<RawChartData, 'fields'>;

export function useChartData(filePath: string | undefined): RawChartData {
  // TODO cache multiple results? (any need to clear out cache?)
  const [{ data, error }, setResult] = React.useState<FetchFileResult>({});

  // used to prevent setting data if file path changes after request starts
  const latestFilePath = React.useRef<string>();
  React.useEffect(() => {
    latestFilePath.current = filePath;
  }, [filePath]);

  React.useEffect(() => {
    if (!filePath) {
      return;
    }
    // Fetch data. If filePath changes during the request, it won't be cancelled
    // (not really necessary for a read) but the result will be thrown away.
    fetcher<ReadFileData>(`api/files/${filePath}`)
      .then((data) => {
        latestFilePath.current === filePath && setResult({ data });
      })
      .catch((error) => {
        latestFilePath.current === filePath && setResult({ error });
      });
  }, [filePath]);

  const fields = React.useMemo(() => data?.[0] && Object.keys(data[0]), [data]);

  return { data, fields, error };
}
