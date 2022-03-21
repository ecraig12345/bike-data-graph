import React from 'react';
import dynamic from 'next/dynamic';

// https://react-dropzone.js.org/
const Dropzone = dynamic(() => import('react-dropzone'));

const DropZone = () => {
  const onDrop = React.useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file: Blob) => {
      const reader = new FileReader();

      reader.onabort = () => console.log('file reading was aborted');
      reader.onerror = () => console.log('file reading has failed');
      reader.onload = () => {
        // Do whatever you want with the file contents
        const binaryStr = reader.result;
        console.log(binaryStr);
      };
      reader.readAsArrayBuffer(file);
    });
  }, []);

  return (
    <Dropzone onDrop={onDrop} accept="text/csv">
      {({ getRootProps, getInputProps }) => {
        return (
          <div
            {...getRootProps({
              style: {
                width: '100%',
                padding: '2em',
                border: '2px dashed gray',
                background: '#eee',
                display: 'flex',
                justifyContent: 'center',
              },
            })}
          >
            <input {...getInputProps()} />
            Drop file or click here
          </div>
        );
      }}
    </Dropzone>
  );
};

export default DropZone;
