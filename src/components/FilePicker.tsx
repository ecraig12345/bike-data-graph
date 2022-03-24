import React from 'react';
import { Toggle } from '@fluentui/react/lib/Toggle';
import { useBoolean } from '@fluentui/react-hooks';
import FileList from './FileList';
import DropZone from './DropZone';
import { State, useStore } from '../utils/useStore';

const lastFileErrorSelector = (s: State) => s.lastFileError;
const fetchFileSelector = (s: State) => s.fetchFile;

const FilePicker: React.FunctionComponent = (props) => {
  const [listFiles, { toggle: toggleListFiles }] = useBoolean(true);
  const lastFileError = useStore(lastFileErrorSelector);
  const fetchFile = useStore(fetchFileSelector);

  return (
    <>
      <Toggle
        inlineLabel
        label="List files"
        checked={listFiles}
        onChange={toggleListFiles}
        id="toggle1"
      />
      {listFiles ? <FileList onFileSelected={fetchFile} /> : <DropZone />}
      {lastFileError && `Error loading "${lastFileError.filePath}": ${lastFileError.error}`}
    </>
  );
};

export default FilePicker;
