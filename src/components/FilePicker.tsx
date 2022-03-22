import React from 'react';
import { Toggle } from '@fluentui/react/lib/Toggle';
import { useBoolean } from '@fluentui/react-hooks';
import FileList from './FileList';
import DropZone from './DropZone';

export type FilePickerProps = {
  onFileSelected: (filePath: string) => void;
};

const FilePicker: React.FunctionComponent<FilePickerProps> = (props) => {
  const [listFiles, { toggle: toggleListFiles }] = useBoolean(true);

  return (
    <>
      <Toggle
        inlineLabel
        label="List files"
        checked={listFiles}
        onChange={toggleListFiles}
        id="toggle1"
      />
      {listFiles ? <FileList onFileSelected={props.onFileSelected} /> : <DropZone />}
    </>
  );
};

export default FilePicker;
