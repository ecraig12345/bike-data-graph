import React from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import { State, useStore } from '../../store/useStore';
import Details from '../basic/Details';
import Error from '../basic/Error';
import DropZone from './DropZone';
import FilesTable from './FilesTable';
import LocalFileList from './LocalFileList';

const styles = mergeStyleSets({
  flex: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1em',
  },
  addFiles: {
    padding: '0 1em',
  },
});

const lastFetchErrorSelector = (s: State) => s.lastFetchError;
const filesSelector = (s: State) => s.files;

const FilePicker: React.FunctionComponent = () => {
  const [lastLoadedFile, setLastLoadedFile] = React.useState<string>('');
  const lastFetchError = useStore(lastFetchErrorSelector);
  const files = useStore(filesSelector);

  const onFileSelected = React.useCallback((file: string | File) => {
    setLastLoadedFile(typeof file === 'string' ? file : file.name);
    return useStore.getState().addFile(file);
  }, []);

  return (
    <div className={styles.flex}>
      <h2>Files</h2>
      <FilesTable />
      <Details summary="Add files" defaultIsOpen className={styles.addFiles}>
        {lastLoadedFile && !files[lastLoadedFile] ? (
          <Spinner label={`Loading ${lastLoadedFile}...`} size={SpinnerSize.large} />
        ) : (
          <div className={styles.flex}>
            <DropZone onFileSelected={onFileSelected} />
            <LocalFileList onFileSelected={onFileSelected} />
            {lastFetchError && (
              <Error>{`Error loading "${lastFetchError.filePath}": ${lastFetchError.error}`}</Error>
            )}
          </div>
        )}
      </Details>
    </div>
  );
};

export default FilePicker;
