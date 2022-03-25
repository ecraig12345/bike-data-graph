import React from 'react';
import {
  Dropdown,
  IDropdownOption,
  IDropdownProps,
  IDropdownStyles,
} from '@fluentui/react/lib/Dropdown';
import FieldTable from './FieldTable';
import { useStore } from '../utils/store/useStore';
import { FileInfo } from '../utils/types';

type DropdownOnChange = Required<IDropdownProps>['onChange'];

const dropdownStyles: Partial<IDropdownStyles> = {
  dropdown: { width: 300 },
  root: { display: 'inline-block', marginRight: 30 },
};

const FieldPicker: React.FunctionComponent = () => {
  // TODO try not to use the whole store
  const { files, timeFields, series, addSeries, removeSeries, setTimeField } = useStore();
  // const { allFields, timeField } = useStore(React.useCallback((s) => s.files[filePath], [filePath]));

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
      setTimeField(filePath!, option!.key as string);
    },
    [filePath, setTimeField]
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
        addSeries({ filePath: filePath!, yField: option!.key as string });
      } else if (ser) {
        removeSeries(ser);
      }
    },
    [addSeries, removeSeries, filePath, findSeries]
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
        selectedKey={timeFields[filePath]}
        styles={dropdownStyles}
      />
      <br />
      <FieldTable />
    </div>
  );
};

export default FieldPicker;
