import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Toggle } from '@fluentui/react/lib/Toggle';
import { useBoolean } from '@fluentui/react-hooks';
import FileList from '../components/FileList';
import DropZone from '../components/DropZone';
import styles from '../styles/Home.module.css';
import { useChartData } from '../utils/chart/useChartData';

const LineChart = dynamic(
  () => import('../components/LineChart'),
  // a dep of the zoom plugin tries to access window on import
  { ssr: false }
);

const fields = ['power', 'Power2'];

export default function Home() {
  const [listFiles, { toggle: toggleListFiles }] = useBoolean(true);
  const [filePath, setFilePath] = React.useState<string>(
    // TODO
    '2022-03-08/2022-03-08-17-31-59.records_data.csv'
  );
  const { data, options, error } = useChartData(filePath, fields);

  return (
    <div className={styles.container}>
      <Head>
        <title>chart thing</title>
        <meta name="description" content="chart thing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>chart thing</h1>

        {!filePath && (
          <>
            <Toggle
              inlineLabel
              label="List files"
              checked={listFiles}
              onChange={toggleListFiles}
              id="toggle1"
            />
            {listFiles ? <FileList onFileSelected={setFilePath} /> : <DropZone />}
          </>
        )}

        {data && !error && <LineChart options={options} data={data} />}
        {/* {filePath && (JSON.stringify(data, null, 2) || error)} */}
      </main>
    </div>
  );
}
