import React from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import { ReadFileData } from '../types';

// https://www.w3schools.com/colors/colors_groups.asp
const colors = ['dodgerblue', 'darkorchid', 'limegreen', 'darkorange', 'deeppink'];
const getColor = (i: number) => colors[i % colors.length];

const yTickStep = 50;

export function useChartProps(
  allData: ReadFileData | undefined,
  timeField: string | undefined,
  fields: string[] | undefined
) {
  const [data, yMax] = React.useMemo(() => {
    if (!(allData && fields?.length && timeField)) {
      return [undefined, undefined];
    }

    let yMax = 0;
    const result: ChartData<'line'> = {
      datasets: fields.map((field, i) => ({
        label: field,
        backgroundColor: getColor(i),
        borderColor: getColor(i),
        borderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 3,
        data: allData.map((r) => {
          const d = {
            x: new Date(r[timeField]).getTime(),
            y: r[field] as number,
          };
          yMax = Math.max(yMax, d.y);
          return d;
        }),
      })),
    };
    return [result, yMax];
  }, [allData, fields, timeField]);

  const options = React.useMemo(() => {
    if (!yMax) {
      return undefined;
    }

    const yBound = yMax + (yTickStep - (yMax % yTickStep));

    const result: ChartOptions<'line'> = {
      animation: false,
      normalized: true,
      parsing: false,
      scales: {
        x: {
          type: 'time',
        },
        y: {
          type: 'linear',
          // Specify max so the axis doesn't change scale when zooming
          max: yBound,
          ticks: { stepSize: yTickStep },
        },
      },
      plugins: {
        // decimation: {
        //   enabled: true,
        //   algorithm: 'lttb',
        //   samples: 250,
        //   threshold: 250,
        // },
        zoom: {
          limits: {
            // can't zoom out beyond original data set
            x: { min: 'original', max: 'original' },
          },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x',
          },
        },
      },
    };
    return result;
  }, [yMax]);

  return { data, options };
}
