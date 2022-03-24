import React from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import FilePicker from '../components/FilePicker';
import ChartStuff from '../components/ChartStuff';
import { State, useStore } from '../utils/useStore';

// TODO support multiple files
const filePathSelector = (s: State): string | undefined => Object.values(s.files)[0]?.filePath;
const fetchFileSelector = (s: State) => s.fetchFile;

export default function Home() {
  const filePath = useStore(filePathSelector);
  const fetchFile = useStore(fetchFileSelector);

  React.useEffect(() => {
    // TODO
    fetchFile('2022-03-08/2022-03-08-17-31-59.records_data.csv');
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

        {filePath ? <ChartStuff /> : <FilePicker />}
      </main>
    </div>
  );
}
