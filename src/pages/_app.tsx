import React from 'react';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@fluentui/react/lib/Theme';
import { SWRConfig, SWRConfiguration } from 'swr';
import { ChartContext, ChartJs } from '../utils/chart/ChartContext';
import { fetcher } from '../utils/fetcher';
import '../styles/globals.css';

const swrConfig: SWRConfiguration = { fetcher };

function MyApp({ Component, pageProps }: AppProps) {
  const [chart, setChart] = React.useState<ChartJs>();
  React.useEffect(() => {
    import('chart.js').then((result) => {
      const { Chart } = result;
      Chart.register(
        result.LineController,
        result.LineElement,
        result.LinearScale,
        result.TimeScale,
        result.TimeSeriesScale
      );
      setChart(() => Chart);
    });
  }, []);

  return (
    <ThemeProvider>
      <SWRConfig value={swrConfig}>
        <ChartContext.Provider value={chart}>
          <Component {...pageProps} />;
        </ChartContext.Provider>
      </SWRConfig>
    </ThemeProvider>
  );
}
export default MyApp;
