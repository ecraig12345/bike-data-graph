import React from 'react';
import type { Chart } from 'chart.js';

export type ChartJs = typeof Chart | undefined;

export const ChartContext = React.createContext<ChartJs>(undefined);
