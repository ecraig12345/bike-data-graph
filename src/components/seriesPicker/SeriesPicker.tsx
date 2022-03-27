import React from 'react';
import { PrimaryButton } from '@fluentui/react/lib/Button';
import {
  Dropdown,
  IDropdownOption,
  IDropdownProps,
  IDropdownStyles,
} from '@fluentui/react/lib/Dropdown';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import shallow from 'zustand/shallow';
import SeriesTable from './SeriesTable';
import { State, useStore } from '../../store/useStore';

type DropdownOnChange = Required<IDropdownProps>['onChange'];

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
  const [selectedFilePath, setSelectedFilePath] = React.useState<string>();
  const [selectedField, setSelectedField] = React.useState<string>();

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
  const onFilesDropdownChange = React.useCallback<DropdownOnChange>((ev, option) => {
    setSelectedFilePath(option!.key as string);
    setSelectedField(undefined);
  }, []);

  const fieldOptions = React.useMemo(() => {
    if (!selectedFilePath) return [];

    const usedFields = series.filter((s) => s.filePath === selectedFilePath).map((s) => s.yField);
    usedFields.push(filesSettings[selectedFilePath].timeField!);

    return files[selectedFilePath].allFields
      .filter((f) => !usedFields.includes(f))
      .map((f): IDropdownOption => ({ key: f, text: f }));
  }, [selectedFilePath, files, filesSettings, series]);

  const onFieldDropdownChange = React.useCallback<DropdownOnChange>((ev, option) => {
    setSelectedField(option!.key as string);
  }, []);

  const onAddClick = React.useCallback(() => {
    useStore.getState().addSeries({ filePath: selectedFilePath!, yField: selectedField! });
  }, [selectedField, selectedFilePath]);

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
            onChange={onFilesDropdownChange}
            styles={dropdownStyles}
          />
          <Dropdown
            label="Field"
            disabled={!fieldOptions.length}
            options={fieldOptions}
            onChange={onFieldDropdownChange}
            styles={dropdownStyles}
          />
          <PrimaryButton disabled={!selectedField} onClick={onAddClick}>
            Add
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default SeriesPicker;
