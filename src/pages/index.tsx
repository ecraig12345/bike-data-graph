import React from 'react';
import Head from 'next/head';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import FilePicker from '../components/filePicker/FilePicker';
import ChartStuff from '../components/chart/ChartStuff';
import { State, useStore } from '../store/useStore';
import SeriesPicker from '../components/seriesPicker/SeriesPicker';

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
    gap: '1em',
    width: '100%',
  },
  tables: {
    width: 'min(100%, 800px)',
    margin: '0 auto 1em',
  },
});

const filesSelector = (s: State) => s.files;

export default function Home() {
  const files = useStore(filesSelector);
  const hasFiles = !!Object.keys(files).length;

  return (
    <div className={styles.container}>
      <Head>
        <title>Bike data comparison</title>
        <meta name="description" content="Bike data comparison" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1>Bike data comparison</h1>
        <div className={styles.tables}>
          <FilePicker />
          <br />
          {hasFiles && <SeriesPicker />}
        </div>
        {hasFiles && <ChartStuff />}
      </main>
    </div>
  );
}
