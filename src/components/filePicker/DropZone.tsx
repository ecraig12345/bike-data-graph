import React from 'react';
import dynamic from 'next/dynamic';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import Error from '../basic/Error';

// https://react-dropzone.js.org/
const ReactDropzone = dynamic(() => import('react-dropzone'));

export type DropZoneProps = {
  onFileSelected: (filePath: string, data: string) => void;
};

const dropClass = mergeStyles({
  width: '100%',
  padding: '2em',
  border: '2px dashed gray',
  background: '#eee',
  display: 'flex',
  justifyContent: 'center',
});

const DropZone: React.FunctionComponent<DropZoneProps> = (props) => {
  const { onFileSelected } = props;
  const [error, setError] = React.useState<string>();

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      setError('');
      // TOOD handle multiple files
      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.onabort = () => setError('File reading aborted');
      reader.onerror = () => setError('Error reading file');
      reader.onload = () => {
        const result =
          typeof reader.result === 'string'
            ? reader.result
            : new TextDecoder('utf-8').decode(reader.result as ArrayBuffer);
        onFileSelected(file.name, result);
      };

      reader.readAsArrayBuffer(file);
    },
    [onFileSelected]
  );

  return (
    // TODO accept multiple files
    <ReactDropzone maxFiles={1} onDrop={onDrop} accept="text/csv">
      {({ getRootProps, getInputProps }) => {
        return (
          <div {...getRootProps({ className: dropClass })}>
            <input {...getInputProps()} />
            Drop file or click here
            {error && (
              <Error>
                <br />
                {error}
              </Error>
            )}
          </div>
        );
      }}
    </ReactDropzone>
  );
};

export default DropZone;
