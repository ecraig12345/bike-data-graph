import React from 'react';
import Head from 'next/head';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import FilePicker from '../components/filePicker/FilePicker';
import ChartStuff from '../components/chart/ChartStuff';
import { State, useStore } from '../store/useStore';

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
  title: {
    margin: '0',
    marginBottom: '1rem',
    fontSize: '2.5rem',
    textAlign: 'center',
  },
});

const filesSelector = (s: State) => s.files;

export default function Home() {
  const files = useStore(filesSelector);

  React.useEffect(() => {
    // TODO
    // useStore.getState().addFile('2022-03-08/2022-03-08-17-31-59.records_data.csv');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Bike data comparison</title>
        <meta name="description" content="Bike data comparison" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Bike data comparison</h1>

        <FilePicker />
        {!!Object.keys(files).length && <ChartStuff />}
      </main>
    </div>
  );
}
