import React from 'react';
import type { ChartData, ChartOptions, DefaultDataPoint, Plugin } from 'chart.js';
import { cloneData, setDatasets } from '../utils/chart/chartUtils';

import {
  Chart,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Decimation,
  Legend,
  Tooltip,
  Title,
  SubTitle,
} from 'chart.js';

// https://www.chartjs.org/chartjs-plugin-zoom/guide/options.html
import zoomPlugin from 'chartjs-plugin-zoom';
// https://github.com/chartjs/chartjs-adapter-date-fns
import 'chartjs-adapter-date-fns';

// inspiration from https://github.com/reactchartjs/react-chartjs-2

export type ChartProps<
  TData = DefaultDataPoint<'line'>,
  TLabel = unknown
> = React.CanvasHTMLAttributes<HTMLCanvasElement> & {
  data: ChartData<'line', TData, TLabel>;
  options?: ChartOptions<'line'>;
  plugins?: Plugin<'line'>[];
  datasetIdKey?: string;
  fallbackContent?: React.ReactNode;
};

function LineChart<TData = DefaultDataPoint<'line'>, TLabel = unknown>(
  props: ChartProps<TData, TLabel>
) {
  const { datasetIdKey, data, options, plugins, fallbackContent, ...rest } = props;
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<Chart<'line', TData, TLabel> | null>(null);

  React.useEffect(() => {
    Chart.register(
      LineController,
      LineElement,
      LinearScale,
      PointElement,
      TimeScale,
      Decimation,
      Legend,
      Tooltip,
      Title,
      SubTitle,
      zoomPlugin
    );

    chartRef.current = new Chart(canvasRef.current!, {
      data: cloneData(data, datasetIdKey),
      options,
      plugins,
      type: 'line',
    });
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run once
  }, []);

  React.useEffect(() => {
    if (chartRef.current && options) {
      chartRef.current.options = { ...options };
    }
  }, [options]);

  React.useEffect(() => {
    if (chartRef.current) {
      chartRef.current.config.data.labels = data.labels;
    }
  }, [data.labels]);

  React.useEffect(() => {
    if (chartRef.current && data.datasets) {
      setDatasets(chartRef.current.config.data, data.datasets, datasetIdKey);
    }
  }, [data.datasets, datasetIdKey]);

  React.useEffect(() => {
    chartRef.current?.update();
  }, [options, data.labels, data.datasets]);

  return (
    <canvas ref={canvasRef} role="img" {...rest}>
      {fallbackContent}
    </canvas>
  );
}

export default LineChart;
