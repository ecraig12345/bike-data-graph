import React from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import LocalFileList from './LocalFileList';
import DropZone from './DropZone';
import { State, useStore } from '../utils/store/useStore';
import Details from './Details';
import Error from './Error';

const lastFetchErrorSelector = (s: State) => s.lastFetchError;
const filesSelector = (s: State) => s.files;

const rootClass = mergeStyles({
  width: 'min(100%, 600px)',
  margin: '0 auto',
  paddingLeft: '1em',
  '> summary': { marginBottom: '1em' },
});

const FilePicker: React.FunctionComponent = () => {
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
    <Details summary="Select files" defaultIsOpen className={rootClass}>
      {loadingFile ? (
        <Spinner label="Loading file..." size={SpinnerSize.large} />
      ) : (
        <>
          <DropZone onFileSelected={onFileSelected} />
          <br />
          <LocalFileList onFileSelected={onFileSelected} />
          <br />
          {lastFetchError && (
            <Error>{`Error loading "${lastFetchError.filePath}": ${lastFetchError.error}`}</Error>
          )}
        </>
      )}
    </Details>
  );
};

export default FilePicker;
