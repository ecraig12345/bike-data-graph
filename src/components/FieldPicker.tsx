import React from 'react';
import {
  Dropdown,
  IDropdownOption,
  IDropdownProps,
  IDropdownStyles,
} from '@fluentui/react/lib/Dropdown';
import shallow from 'zustand/shallow';
import FieldTable from './FieldTable';
import { State, useStore } from '../utils/store/useStore';
import { FileInfo } from '../utils/types';

type DropdownOnChange = Required<IDropdownProps>['onChange'];

const dropdownStyles: Partial<IDropdownStyles> = {
  dropdown: { width: 300 },
  root: { display: 'inline-block', marginRight: 30 },
};

const selector = (s: State) => ({
  files: s.files,
  filesSettings: s.filesSettings,
  series: s.series,
});

const FieldPicker: React.FunctionComponent = () => {
  const { files, filesSettings, series } = useStore(selector, shallow);

  // TODO support multiple files
  const { allFields, filePath } = (Object.values(files) as FileInfo[] | undefined[])[0] || {};

  const dropdownOptions = React.useMemo(
    () => allFields?.map((f): IDropdownOption => ({ key: f, text: f })),
    [allFields]
  );
  const selectedKeys = React.useMemo(
    () => series.filter((s) => s.filePath === filePath).map((s) => s.yField),
    [series, filePath]
  );

  const onTimeDropdownChange = React.useCallback<DropdownOnChange>(
    (_ev, option) => {
      useStore.getState().updateFileSettings(filePath!, { timeField: option!.key as string });
    },
    [filePath]
  );

  const findSeries = React.useCallback(
    (option: IDropdownOption | undefined) => {
      const fieldName = option!.key as string;
      return series.find((s) => s.yField === fieldName && s.filePath === filePath);
    },
    [series, filePath]
  );

  const onFieldsDropdownChange = React.useCallback<DropdownOnChange>(
    (_ev, option) => {
      const ser = findSeries(option);
      if (option!.selected) {
        useStore.getState().addSeries({ filePath: filePath!, yField: option!.key as string });
      } else if (ser) {
        useStore.getState().removeSeries(ser);
      }
    },
    [filePath, findSeries]
  );

  if (!dropdownOptions || !filePath) {
    return null;
  }

  return (
    <div>
      <Dropdown
        label="Y-axis fields"
        multiSelect
        options={dropdownOptions}
        onChange={onFieldsDropdownChange}
        selectedKeys={selectedKeys}
        styles={dropdownStyles}
      />
      <Dropdown
        label="Time scale field (MUST contain string or milliseconds of Date)"
        options={dropdownOptions}
        onChange={onTimeDropdownChange}
        selectedKey={filesSettings[filePath].timeField}
        styles={dropdownStyles}
      />
      <br />
      <br />
      <FieldTable />
    </div>
  );
};

export default FieldPicker;
