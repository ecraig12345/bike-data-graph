import React from 'react';
import dynamic from 'next/dynamic';
import type { ChartData, ChartDataset, ChartOptions, ScatterDataPoint } from 'chart.js';
import { State, useStore } from '../utils/useStore';
import FieldPicker from './FieldPicker';

const LineChart = dynamic(
  () => import('./LineChart'),
  // a dep of the zoom plugin tries to access window on import
  { ssr: false }
);

const yTickStep = 50;

const filesSelector = (s: State) => s.files;
const seriesSelector = (s: State) => s.series;

const ChartStuff: React.FunctionComponent = () => {
  const files = useStore(filesSelector);
  const series = useStore(seriesSelector);

  // TODO more granular calculations?
  // should see how much it slows when changing fields with larger data sets.
  const { data, yMax } = React.useMemo(() => {
    let yMax = 0;
    const datasets: ChartDataset<'line', ScatterDataPoint[]>[] = series
      .filter((d) => !!files[d.filePath]?.timeField)
      .map(({ yField, filePath, color }, i) => {
        const { timeField, rawData } = files[filePath];
        return {
          label: yField,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 3,
          data: rawData.map((r) => {
            const d = {
              x: new Date(r[timeField!]).getTime(),
              y: Number(r[yField]),
            };
            yMax = Math.max(yMax, d.y);
            return d;
          }),
        };
      });

    const data: ChartData<'line', ScatterDataPoint[]> = { datasets };
    return datasets.length ? { data, yMax } : {};
  }, [files, series]);

  // TODO don't pull from just one file
  const displayName = Object.values(files)[0]?.displayName;

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
          time: { minUnit: 'minute' },
          // keep rotation consistent while zooming
          ticks: { maxRotation: 45, minRotation: 45 },
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
          text: displayName,
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
  }, [yMax, displayName]);

  return (
    <>
      {data && <LineChart options={options} data={data} />}
      <FieldPicker />
    </>
  );
};

export default ChartStuff;
