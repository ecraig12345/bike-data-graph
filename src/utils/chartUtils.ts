// https://github.com/reactchartjs/react-chartjs-2/blob/master/src/utils.ts

import * as React from 'react';
import type { ChartType, ChartData, DefaultDataPoint, ChartDataset, Chart } from 'chart.js';

const defaultDatasetIdKey = 'label';

export function setDatasets<
  TType extends ChartType = ChartType,
  TData = DefaultDataPoint<TType>,
  TLabel = unknown
>(
  currentData: ChartData<TType, TData, TLabel>,
  nextDatasets: ChartDataset<TType, TData>[],
  datasetIdKey = defaultDatasetIdKey
) {
  const addedDatasets: ChartDataset<TType, TData>[] = [];

  currentData.datasets = nextDatasets.map((nextDataset: Record<string, unknown>) => {
    // given the new set, find it's current match
    const currentDataset = currentData.datasets.find(
      (dataset: Record<string, unknown>) => dataset[datasetIdKey] === nextDataset[datasetIdKey]
    );

    // There is no original to update, so simply add new one
    if (!currentDataset || !nextDataset.data || addedDatasets.includes(currentDataset)) {
      return { ...nextDataset } as ChartDataset<TType, TData>;
    }

    addedDatasets.push(currentDataset);

    Object.assign(currentDataset, nextDataset);

    return currentDataset;
  });
}

export function cloneData<
  TType extends ChartType = ChartType,
  TData = DefaultDataPoint<TType>,
  TLabel = unknown
>(data: ChartData<TType, TData, TLabel>, datasetIdKey = defaultDatasetIdKey) {
  const nextData: ChartData<TType, TData, TLabel> = {
    labels: data.labels,
    datasets: [],
  };

  setDatasets(nextData, data.datasets, datasetIdKey);

  return nextData;
}

/**
 * Get dataset from mouse click event
 * @param chart - Chart.js instance
 * @param event - Mouse click event
 * @returns Dataset
 */
export function getDatasetAtEvent(chart: Chart, event: React.MouseEvent<HTMLCanvasElement>) {
  return chart.getElementsAtEventForMode(event.nativeEvent, 'dataset', { intersect: true }, false);
}

/**
 * Get single dataset element from mouse click event
 * @param chart - Chart.js instance
 * @param event - Mouse click event
 * @returns Dataset
 */
export function getElementAtEvent(chart: Chart, event: React.MouseEvent<HTMLCanvasElement>) {
  return chart.getElementsAtEventForMode(event.nativeEvent, 'nearest', { intersect: true }, false);
}

/**
 * Get all dataset elements from mouse click event
 * @param chart - Chart.js instance
 * @param event - Mouse click event
 * @returns Dataset
 */
export function getElementsAtEvent(chart: Chart, event: React.MouseEvent<HTMLCanvasElement>) {
  return chart.getElementsAtEventForMode(event.nativeEvent, 'index', { intersect: true }, false);
}
