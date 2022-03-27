import React from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { State, useStore } from '../../store/useStore';
import Details from '../basic/Details';
import Error from '../basic/Error';
import DropZone from './DropZone';
import FilesTable from './FilesTable';
import LocalFileList from './LocalFileList';

const addFilesClass = mergeStyles({
  paddingLeft: '1em',
  '> summary': { marginBottom: '1em' },
});

const lastFetchErrorSelector = (s: State) => s.lastFetchError;
const filesSelector = (s: State) => s.files;

const FileList: React.FunctionComponent = () => {
  const [lastLoadedFile, setLastLoadedFile] = React.useState<string>('');
  const lastFetchError = useStore(lastFetchErrorSelector);
  const files = useStore(filesSelector);

  const onFileSelected = React.useCallback((file: string | File) => {
    setLastLoadedFile(typeof file === 'string' ? file : file.name);
    return useStore.getState().addFile(file);
  }, []);

  return (
    <>
      <FilesTable />
      <br />
      <Details summary="Add files" defaultIsOpen className={addFilesClass}>
        {lastLoadedFile && !files[lastLoadedFile] ? (
          <Spinner label={`Loading ${lastLoadedFile}...`} size={SpinnerSize.large} />
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
    </>
  );
};

export default FileList;
