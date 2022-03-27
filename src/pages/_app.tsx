import React from 'react';
import type { AppProps } from 'next/app';
import { initializeIcons } from '@fluentui/react/lib/Icons';
import { ThemeProvider } from '@fluentui/react/lib/Theme';
import { getDocument } from '@fluentui/react/lib/Utilities';
import '../styles/globals.css';

// only initialize icons on client (should be okay since no icons are used in initial components)
getDocument() && initializeIcons();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />;
    </ThemeProvider>
  );
}
export default MyApp;
