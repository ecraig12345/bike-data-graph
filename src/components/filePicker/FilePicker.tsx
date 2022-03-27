import React from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import { css, getDocument } from '@fluentui/react/lib/Utilities';
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
  addFiles: { padding: '0 1em' },
  hidden: { display: 'none' },
});

const lastFetchErrorSelector = (s: State) => s.lastFetchError;
const filesSelector = (s: State) => s.files;

const FilePicker: React.FunctionComponent = () => {
  const [lastLoadedFile, setLastLoadedFile] = React.useState<string>('');
  const lastFetchError = useStore(lastFetchErrorSelector);
  const files = useStore(filesSelector);
  const isLoading = !!lastLoadedFile && !files[lastLoadedFile];

  const [isLocal, setIsLocal] = React.useState(false);
  React.useEffect(() => {
    const doc = getDocument();
    setIsLocal(doc?.location?.hostname === 'localhost');
  }, []);

  const onFileSelected = React.useCallback((file: string | File) => {
    setLastLoadedFile(typeof file === 'string' ? file : file.name);
    return useStore.getState().addFile(file);
  }, []);

  React.useEffect(() => {
    if (files[lastLoadedFile] || lastFetchError?.filePath === lastLoadedFile) {
      setLastLoadedFile('');
    }
    // this is to clear the last loaded file when the upload finishes or there's an error
    // (otherwise the loading spinner could reappear later by accident)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, lastFetchError]);

  return (
    <div className={styles.flex}>
      <h2>Select files</h2>
      <FilesTable />
      <Details summary="Add files" defaultIsOpen className={styles.addFiles}>
        {isLoading && <Spinner label={`Loading ${lastLoadedFile}...`} size={SpinnerSize.large} />}
        {/* While uploading, hide the selection controls, but don't unmount them because if
          multiple files are dropped in the DropZone, it needs to handle those in series (and
          it can't do that if it's been unmounted) */}
        <div className={css(styles.flex, isLoading && styles.hidden)}>
          <DropZone onFileSelected={onFileSelected} />
          {isLocal && <LocalFileList onFileSelected={onFileSelected} />}
          {lastFetchError && (
            <Error>{`Error loading "${lastFetchError.filePath}": ${lastFetchError.error}`}</Error>
          )}
        </div>
      </Details>
    </div>
  );
};

export default FilePicker;
