import React from 'react';
import useSWR from 'swr';
import type { ChartData, ChartOptions } from 'chart.js';
import type { ConvertedFitData, ReadFileData } from '../types';

const colors = ['dodgerblue', 'darkorchid', 'limegreen', 'darkorange', 'deeppink'];
const getColor = (i: number) => colors[i % colors.length];

export function useChartData(filePath: string | undefined, fields: string[]) {
  const { data, error: getDataError } = useSWR<ReadFileData, string>(
    filePath ? `api/files/${filePath}` : null,
    {
      revalidateOnFocus: false, // https://swr.vercel.app/docs/revalidation
      revalidateOnReconnect: false,
    }
  );

  const error = React.useMemo(() => {
    if (data && !data[0].timestamp) {
      console.error('data must include a timestamp field');
      return 'data must include a timestamp field';
    }
    return getDataError;
  }, [data, getDataError]);

  const transformedData = React.useMemo(() => {
    if (!data) {
      return undefined;
    }
    console.log('partial data', data.slice(0, 10));
    const useFields = fields.filter((field) => {
      if (typeof data[0][field] === 'undefined') {
        console.error('Data is missing expected field: ' + field);
        return false;
      }
      return true;
    });

    const result: ChartData<'line'> = {
      datasets: useFields.map((field, i) => ({
        label: field,
        backgroundColor: getColor(i),
        borderColor: getColor(i),
        // TODO not a good assumption of data format
        data: (data as ConvertedFitData[]).map((r) => ({
          x: new Date(r.timestamp).getTime(),
          y: r[field as keyof ConvertedFitData] as number,
        })),
      })),
    };
    return result;
  }, [data, fields]);

  const options = React.useMemo(
    (): ChartOptions<'line'> => ({
      animation: false,
      parsing: false,
      scales: {
        x: {
          type: 'time',
        },
      },
      plugins: {
        zoom: {
          limits: {
            // TODO not working as I expect
            y: { min: 'original', max: 'original' },
          },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x',
          },
        },
      },
    }),
    []
  );

  return { data: transformedData, options, error };
}
