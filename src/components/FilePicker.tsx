import React from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import { Toggle } from '@fluentui/react/lib/Toggle';
import { useBoolean } from '@fluentui/react-hooks';
import FileList from './FileList';
import DropZone from './DropZone';
import { State, useStore } from '../utils/useStore';

const lastFetchErrorSelector = (s: State) => s.lastFetchError;

const styles = mergeStyleSets({
  root: { width: 'min(100%, 600px)', margin: '0 auto' },
  error: { color: 'red' },
});

const FilePicker: React.FunctionComponent = () => {
  const [listFiles, { toggle: toggleListFiles }] = useBoolean(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const lastFetchError = useStore(lastFetchErrorSelector);

  const onFileSelected = React.useCallback((filePath: string, csvData?: string) => {
    setIsLoading(true);
    useStore.getState().fetchFile(filePath, csvData);
  }, []);

  React.useEffect(() => {
    if (lastFetchError) {
      setIsLoading(false);
    }
  }, [lastFetchError]);

  return (
    <div className={styles.root}>
      <Toggle
        inlineLabel
        label="List files"
        checked={listFiles}
        onChange={toggleListFiles}
        id="toggle1"
      />
      {isLoading ? (
        <Spinner label="Loading file..." size={SpinnerSize.large} />
      ) : (
        <>
          {listFiles ? (
            <FileList onFileSelected={onFileSelected} />
          ) : (
            <DropZone onFileSelected={onFileSelected} />
          )}
          {lastFetchError && (
            <p className={styles.error}>
              {`Error loading "${lastFetchError.filePath}": ${lastFetchError.error}`}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default FilePicker;
