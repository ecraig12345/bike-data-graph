import React from 'react';
import { ContextualMenu, IContextualMenuItem } from '@fluentui/react/lib/ContextualMenu';
import { useMergedRefs } from '@fluentui/react-hooks';
import { cloneData, getElementsAtXAxis, setDatasets } from '../../utils/chart/chartUtils';
import {
  ChartData,
  ChartOptions,
  DefaultDataPoint,
  Plugin,
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
  InteractionItem,
} from 'chart.js';

// https://www.chartjs.org/chartjs-plugin-zoom/guide/options.html
import zoomPlugin from 'chartjs-plugin-zoom';
// https://github.com/chartjs/chartjs-adapter-date-fns
import 'chartjs-adapter-date-fns';

// inspiration from https://github.com/reactchartjs/react-chartjs-2

export type LineChartProps<
  TData = DefaultDataPoint<'line'>,
  TLabel = unknown
> = React.CanvasHTMLAttributes<HTMLCanvasElement> & {
  data: ChartData<'line', TData, TLabel>;
  options?: ChartOptions<'line'>;
  plugins?: Plugin<'line'>[];
  /**
   * Property name which can be used as a unique, stable identifier for each of
   * `data.datasets`, to determine whether the list of datasets has changed
   * @default 'label'
   */
  datasetIdKey?: string;
  fallbackContent?: React.ReactNode;
  chartRef?: React.MutableRefObject<Chart<'line', TData, TLabel> | null>;
  getContextualMenuItems?: (points: InteractionItem[]) => IContextualMenuItem[] | undefined;
};

function LineChart<TData = DefaultDataPoint<'line'>, TLabel = unknown>(
  props: LineChartProps<TData, TLabel>
) {
  const {
    datasetIdKey,
    data,
    options,
    plugins,
    fallbackContent,
    getContextualMenuItems,
    onContextMenu: propsOnContextMenu,
    chartRef: propsChartRef,
    ...rest
  } = props;
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  // in the useMergedRefs implementation this is mutable, the type is just wrong
  const chartRef = (useMergedRefs(React.useRef(null), propsChartRef) as typeof propsChartRef)!;

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

  // Updating chart data on props change
  React.useEffect(() => {
    if (chartRef.current && options) {
      chartRef.current.options = { ...options };
    }
  }, [chartRef, options]);

  React.useEffect(() => {
    if (chartRef.current) {
      chartRef.current.config.data.labels = data.labels;
    }
  }, [chartRef, data.labels]);

  React.useEffect(() => {
    if (chartRef.current && data.datasets) {
      setDatasets(chartRef.current.config.data, data.datasets, datasetIdKey);
    }
  }, [chartRef, data.datasets, datasetIdKey]);

  React.useEffect(() => {
    chartRef.current?.update();
  }, [options, data.labels, data.datasets, chartRef]);

  // Right click menu
  const [menuItems, setMenuItems] = React.useState<IContextualMenuItem[]>();
  const [menuTarget, setMenuTarget] = React.useState<MouseEvent>();
  const onMenuDismiss = React.useCallback(() => {
    setMenuItems(undefined);
    setMenuTarget(undefined);
  }, []);
  const onContextMenu = React.useCallback(
    (ev: React.MouseEvent<HTMLCanvasElement>) => {
      propsOnContextMenu?.(ev);
      if (!getContextualMenuItems) {
        return;
      }
      const points = getElementsAtXAxis(chartRef.current!, ev);
      const items = getContextualMenuItems(points);
      if (items?.length) {
        ev.preventDefault();
        setMenuItems(items);
        setMenuTarget(ev.nativeEvent);
      } else {
        onMenuDismiss();
      }
    },
    [chartRef, getContextualMenuItems, onMenuDismiss, propsOnContextMenu]
  );

  return (
    <>
      <canvas role="img" onContextMenu={onContextMenu} {...rest} ref={canvasRef}>
        {fallbackContent}
      </canvas>
      {!!(menuItems && menuTarget) && (
        <ContextualMenu items={menuItems} target={menuTarget} onDismiss={onMenuDismiss} />
      )}
    </>
  );
}

export default LineChart;
