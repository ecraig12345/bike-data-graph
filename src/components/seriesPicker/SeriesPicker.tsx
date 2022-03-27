import React from 'react';
import { PrimaryButton } from '@fluentui/react/lib/Button';
import {
  Dropdown,
  IDropdownOption,
  IDropdownProps,
  IDropdownStyles,
  IDropdown,
} from '@fluentui/react/lib/Dropdown';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import shallow from 'zustand/shallow';
import SeriesTable from './SeriesTable';
import { State, useStore } from '../../store/useStore';

const dropdownStyles: Partial<IDropdownStyles> = {
  root: { display: 'inline-flex', gap: 10, width: 250, '.ms-layer': { display: 'none' } },
  dropdown: { flexGrow: '1', overflow: 'hidden' },
  dropdownOptionText: { overflow: 'visible', whiteSpace: 'normal' },
  dropdownItem: { height: 'auto' },
};

const styles = mergeStyleSets({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1em',
  },
  addSeriesText: { fontWeight: 'bold', marginBottom: '0.4em' },
  addSeries: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
  },
});

const selector = (s: State) => ({
  files: s.files,
  filesSettings: s.filesSettings,
  series: s.series,
});

const SeriesPicker: React.FunctionComponent = () => {
  const { files, filesSettings, series } = useStore(selector, shallow);
  const [selectedFilePath, setSelectedFilePath] = React.useState<string>('');
  const fieldsDropdownRef = React.useRef<IDropdown>(null);

  const filesOptions = React.useMemo(
    () =>
      Object.entries(filesSettings)
        .filter(([, fileSettings]) => !!fileSettings.timeField)
        .map(
          ([filePath, fileSettings]): IDropdownOption<string> => ({
            key: filePath,
            text: fileSettings.displayName,
          })
        ),
    [filesSettings]
  );
  const onFilesDropdownChange = React.useCallback<NonNullable<IDropdownProps['onChange']>>(
    (ev, option) => {
      setSelectedFilePath(option!.key as string);
    },
    []
  );

  const fieldOptions = React.useMemo(() => {
    if (!selectedFilePath) return [];

    const usedFields = series.filter((s) => s.filePath === selectedFilePath).map((s) => s.yField);
    usedFields.push(filesSettings[selectedFilePath].timeField!);

    return files[selectedFilePath].allFields
      .filter((f) => !usedFields.includes(f))
      .map((f): IDropdownOption => ({ key: f, text: f }));
  }, [selectedFilePath, files, filesSettings, series]);

  const onAddClick = React.useCallback(() => {
    // Accurately tracking and updating or invalidating the selected field through all types of
    // updates turns out to be difficult, so:
    // - pull the latest value from the field instead of trying to follow changes
    // - just alert if nothing has been chosen instead of disabling the button
    const selectedField = fieldsDropdownRef.current?.selectedOptions[0]?.key as string | undefined;
    if (selectedField) {
      useStore.getState().addSeries({ filePath: selectedFilePath!, yField: selectedField! });
    } else {
      alert('Please select a field');
    }
  }, [selectedFilePath]);

  React.useEffect(() => {
    if (filesOptions.length) {
      if (!selectedFilePath || !filesSettings[selectedFilePath]) {
        // select the first option if:
        // - options are newly available
        // - the previously-selected file was removed
        setSelectedFilePath(filesOptions[0].key as string);
      }
    } else if (selectedFilePath) {
      // no options => clear selection
      setSelectedFilePath('');
    }
    // update state if needed when files are changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesOptions]);

  return (
    <div className={styles.root}>
      <h2>Select series</h2>
      <SeriesTable />
      <div>
        <div className={styles.addSeriesText}>Add a new series</div>
        <div className={styles.addSeries}>
          <Dropdown
            label="File"
            options={filesOptions}
            selectedKey={selectedFilePath}
            onChange={onFilesDropdownChange}
            styles={dropdownStyles}
          />
          <Dropdown
            label="Field"
            disabled={!fieldOptions.length}
            options={fieldOptions}
            styles={dropdownStyles}
            componentRef={fieldsDropdownRef}
          />
          <PrimaryButton disabled={!selectedFilePath} onClick={onAddClick}>
            Add
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default SeriesPicker;
