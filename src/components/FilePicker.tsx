import React from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import { useBoolean } from '@fluentui/react-hooks';
import FileList from './FileList';
import DropZone from './DropZone';
import { State, useStore } from '../utils/store/useStore';

const lastFetchErrorSelector = (s: State) => s.lastFetchError;
const filesSelector = (s: State) => s.files;

const styles = mergeStyleSets({
  root: {
    width: 'min(100%, 600px)',
    margin: '0 auto',
    paddingLeft: '1em',
  },
  summary: { cursor: 'pointer', marginLeft: '-1em' },
  fileList: { paddingLeft: '1em' },
  error: { color: 'red' },
});

const FilePicker: React.FunctionComponent = () => {
  const [isOpen, { toggle: toggleIsOpen }] = useBoolean(true);
  const [loadingFile, setLoadingFile] = React.useState<string>('');
  const lastFetchError = useStore(lastFetchErrorSelector);
  const files = useStore(filesSelector);

  const onFileSelected = React.useCallback((filePath: string, csvData?: string) => {
    setLoadingFile(filePath);
    useStore.getState().addFile(filePath, csvData);
  }, []);

  React.useEffect(() => {
    if (lastFetchError || files[loadingFile]) {
      setLoadingFile('');
    }
  }, [files, lastFetchError, loadingFile]);

  return (
    <details open={isOpen} className={styles.root}>
      <summary className={styles.summary} onClick={toggleIsOpen}>
        Select files
      </summary>
      <br />
      {loadingFile ? (
        <Spinner label="Loading file..." size={SpinnerSize.large} />
      ) : (
        <>
          <details className={styles.fileList}>
            <summary className={styles.summary}>Data files</summary>
            <br />
            <FileList onFileSelected={onFileSelected} />
          </details>
          <br />
          <DropZone onFileSelected={onFileSelected} />
          <br />
          {lastFetchError && (
            <div className={styles.error}>
              {`Error loading "${lastFetchError.filePath}": ${lastFetchError.error}`}
            </div>
          )}
        </>
      )}
    </details>
  );
};

export default FilePicker;
