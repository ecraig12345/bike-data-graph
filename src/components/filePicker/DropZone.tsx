import React from 'react';
import dynamic from 'next/dynamic';
import { mergeStyles } from '@fluentui/react/lib/Styling';

// https://react-dropzone.js.org/
const ReactDropzone = dynamic(() => import('react-dropzone'));

export type DropZoneProps = {
  onFileSelected: (file: File) => Promise<boolean>;
};

const dropClass = mergeStyles({
  width: '100%',
  padding: '2em',
  border: '2px dashed gray',
  background: '#eee',
  display: 'flex',
  justifyContent: 'center',
  cursor: 'pointer',
});

const DropZone: React.FunctionComponent<DropZoneProps> = (props) => {
  const { onFileSelected } = props;
  const [isUploading, setIsUploading] = React.useState(false);

  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);

      for (const file of acceptedFiles) {
        const success = await onFileSelected(file);
        if (!success) {
          // It's simplest to just stop after the first error, but ideally this would
          // continue reading subsequent files if one fails
          break;
        }
      }

      setIsUploading(false);
    },
    [onFileSelected]
  );

  return (
    <ReactDropzone disabled={isUploading} onDrop={onDrop} accept="text/csv">
      {({ getRootProps, getInputProps }) => {
        return (
          <div {...getRootProps({ className: dropClass })}>
            <input {...getInputProps()} />
            Drop CSV files or click here
          </div>
        );
      }}
    </ReactDropzone>
  );
};

export default DropZone;
