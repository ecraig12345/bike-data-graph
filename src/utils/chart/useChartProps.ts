import React from 'react';
import type { ChartData, ChartOptions } from 'chart.js';
import { ReadFileData } from '../types';

// https://www.w3schools.com/colors/colors_groups.asp
const colors = ['dodgerblue', 'darkorchid', 'limegreen', 'darkorange', 'deeppink'];
const getColor = (i: number) => colors[i % colors.length];

const yTickStep = 50;

export function useChartProps(
  filePath: string,
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
          time: {
            minUnit: 'minute',
          },
          ticks: {
            maxRotation: 50,
            minRotation: 50,
          },
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
        legend: {
          position: 'bottom',
        },
        title: {
          display: true,
          text: filePath,
          font: { size: 24 },
        },
        subtitle: {
          display: true,
          text: ['Pinch, scroll, or click and drag to zoom. Shift+drag to pan.', ''],
          font: { size: 14 },
        },
        zoom: {
          limits: {
            // can't zoom out beyond original data set or in beyond 3 minutes
            x: { min: 'original', max: 'original', minRange: 1000 * 60 * 3 },
          },
          pan: {
            enabled: true,
            mode: 'x',
            modifierKey: 'shift',
          },
          zoom: {
            drag: { enabled: true },
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x',
          },
        },
      },
    };
    return result;
  }, [yMax, filePath]);

  return { data, options };
}
