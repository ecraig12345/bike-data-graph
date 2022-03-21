import React from 'react';
import Head from 'next/head';
import { Toggle } from '@fluentui/react/lib/Toggle';
import FileList from '../components/FileList';
import DropZone from '../components/DropZone';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [listFiles, setListFiles] = React.useState(true);
  const toggleListFiles = React.useCallback(() => setListFiles((v) => !v), []);

  return (
    <div className={styles.container}>
      <Head>
        <title>chart thing</title>
        <meta name="description" content="chart thing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>chart thing</h1>

        <Toggle
          inlineLabel
          label="List files"
          checked={listFiles}
          onChange={toggleListFiles}
          id="toggle1"
        />
        {listFiles ? <FileList onFileSelected={() => undefined} /> : <DropZone />}
      </main>
    </div>
  );
}
