import React from 'react';
import { Toggle } from '@fluentui/react/lib/Toggle';
import { useBoolean } from '@fluentui/react-hooks';
import FileList from './FileList';
import DropZone from './DropZone';
import { State, useStore } from '../utils/useStore';

const lastFetchFileErrorSelector = (s: State) => s.lastFetchFileError;

const FilePicker: React.FunctionComponent = () => {
  const [listFiles, { toggle: toggleListFiles }] = useBoolean(true);
  const lastFetchFileError = useStore(lastFetchFileErrorSelector);

  return (
    <>
      <Toggle
        inlineLabel
        label="List files"
        checked={listFiles}
        onChange={toggleListFiles}
        id="toggle1"
      />
      {listFiles ? <FileList /> : <DropZone />}
      {lastFetchFileError &&
        `Error loading "${lastFetchFileError.filePath}": ${lastFetchFileError.error}`}
    </>
  );
};

export default FilePicker;
