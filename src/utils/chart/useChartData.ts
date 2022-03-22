import React from 'react';
import useSWR from 'swr';
import type { ReadFileData } from '../types';

export function useChartData(filePath: string | undefined) {
  const { data, error } = useSWR<ReadFileData, string>(filePath ? `api/files/${filePath}` : null, {
    revalidateOnFocus: false, // https://swr.vercel.app/docs/revalidation
    revalidateOnReconnect: false,
  });

  const fields = React.useMemo(() => data && Object.keys(data[0]), [data]);

  return { data, fields, error };
}
