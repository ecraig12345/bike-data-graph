import React from 'react';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@fluentui/react/lib/Theme';
import { SWRConfig, SWRConfiguration } from 'swr';
import { fetcher } from '../utils/fetcher';
import '../styles/globals.css';

const swrConfig: SWRConfiguration = { fetcher };

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <SWRConfig value={swrConfig}>
        <Component {...pageProps} />;
      </SWRConfig>
    </ThemeProvider>
  );
}
export default MyApp;
