import React from 'react';
import type { AppProps } from 'next/app';
import { initializeIcons } from '@fluentui/react/lib/Icons';
import { ThemeProvider } from '@fluentui/react/lib/Theme';
import '../styles/globals.css';

initializeIcons();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />;
    </ThemeProvider>
  );
}
export default MyApp;
