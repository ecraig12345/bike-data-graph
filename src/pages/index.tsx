import React from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import FilePicker from '../components/FilePicker';
import ChartStuff from '../components/ChartStuff';

export default function Home() {
  const [filePath, setFilePath] = React.useState<string>(
    // TODO
    '2022-03-08/2022-03-08-17-31-59.records_data.csv'
  );

  return (
    <div className={styles.container}>
      <Head>
        <title>chart thing</title>
        <meta name="description" content="chart thing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>chart thing</h1>

        {filePath ? (
          <ChartStuff filePath={filePath} />
        ) : (
          <FilePicker onFileSelected={setFilePath} />
        )}
      </main>
    </div>
  );
}
