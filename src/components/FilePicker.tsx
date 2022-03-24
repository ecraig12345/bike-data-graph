import React from 'react';
import { Toggle } from '@fluentui/react/lib/Toggle';
import { useBoolean } from '@fluentui/react-hooks';
import FileList from './FileList';
import DropZone from './DropZone';
import { State, useStore } from '../utils/useStore';

const lastFileErrorSelector = (s: State) => s.lastFileError;

const FilePicker: React.FunctionComponent = () => {
  const [listFiles, { toggle: toggleListFiles }] = useBoolean(true);
  const lastFileError = useStore(lastFileErrorSelector);

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
      {lastFileError && `Error loading "${lastFileError.filePath}": ${lastFileError.error}`}
    </>
  );
};

export default FilePicker;
