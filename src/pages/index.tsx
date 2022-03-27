import React from 'react';
import Head from 'next/head';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import FilePicker from '../components/filePicker/FilePicker';
import ChartStuff from '../components/chart/ChartStuff';
import { State, useStore } from '../store/useStore';
import SeriesPicker from '../components/seriesPicker/SeriesPicker';
import ChartControls from '../components/chart/ChartControls';

const styles = mergeStyleSets({
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  main: {
    padding: '3rem 80px',
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '2em',
    width: '100%',
  },
  controls: {
    width: 'min(100%, 800px)',
    margin: '0 auto 1em',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.8em',
  },
});

const hasFilesSelector = (s: State) => !!Object.keys(s.files).length;

export default function Home() {
  const hasFiles = useStore(hasFilesSelector);

  return (
    <div className={styles.container}>
      <Head>
        <title>Bike data comparison</title>
        <meta name="description" content="Bike data comparison" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1>Bike data comparison</h1>
        <div className={styles.controls}>
          <FilePicker />
          {hasFiles && <SeriesPicker />}
          {hasFiles && <ChartControls />}
        </div>
        {hasFiles && <ChartStuff />}
      </main>
    </div>
  );
}
