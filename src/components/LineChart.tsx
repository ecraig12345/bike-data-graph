import React from 'react';
import type { Chart, ChartData, ChartOptions, DefaultDataPoint, Plugin } from 'chart.js';
import { ChartContext } from '../utils/chart/ChartContext';
import { cloneData, setDatasets } from '../utils/chart/chartUtils';

// https://github.com/chartjs/chartjs-adapter-date-fns
import 'chartjs-adapter-date-fns';

// inspiration from https://github.com/reactchartjs/react-chartjs-2

export interface ChartProps<TData = DefaultDataPoint<'line'>, TLabel = unknown>
  extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  data: ChartData<'line', TData, TLabel>;
  options?: ChartOptions<'line'>;
  plugins?: Plugin<'line'>[];
  datasetIdKey?: string;
  fallbackContent?: React.ReactNode;
}

function LineChart<TData = DefaultDataPoint<'line'>, TLabel = unknown>(
  props: ChartProps<TData, TLabel>
) {
  const {
    height = 400,
    width = 600,
    datasetIdKey,
    data,
    options,
    plugins,
    fallbackContent,
    ...rest
  } = props;
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<Chart<'line', TData, TLabel> | null>(null);
  const ChartJS = React.useContext(ChartContext);

  React.useEffect(() => {
    if (ChartJS) {
      chartRef.current = new ChartJS(canvasRef.current!, {
        data: cloneData(data, datasetIdKey),
        options,
        plugins,
        type: 'line',
      });
      return () => {
        chartRef.current?.destroy();
        chartRef.current = null;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run once
  }, [ChartJS]);

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
    <canvas ref={canvasRef} role="img" height={height} width={width} {...rest}>
      {fallbackContent}
    </canvas>
  );
}

export default LineChart;
