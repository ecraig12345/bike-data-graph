import React from 'react';
import {
  Dropdown,
  IDropdownOption,
  IDropdownProps,
  IDropdownStyles,
} from '@fluentui/react/lib/Dropdown';
import FieldTable from './FieldTable';

export type FieldPickerProps = {
  allFields: string[];
  timeField: string | undefined;
  fields: string[];
  setTimeField: (timeField: string) => void;
  setFields: (fields: string[]) => void;
};

type DropdownOnChange = Required<IDropdownProps>['onChange'];

const dropdownStyles: Partial<IDropdownStyles> = { dropdown: { width: 300 } };

const FieldPicker: React.FunctionComponent<FieldPickerProps> = (props) => {
  const { allFields, fields, timeField, setTimeField, setFields } = props;

  const dropdownOptions = React.useMemo(
    (): IDropdownOption[] => allFields.map((f) => ({ key: f, text: f })),
    [allFields]
  );
  const onTimeDropdownChange = React.useCallback<DropdownOnChange>(
    (_ev, option) => {
      setTimeField(option!.key as string);
    },
    [setTimeField]
  );

  const onFieldsDropdownChange = React.useCallback<DropdownOnChange>(
    (_ev, option) => {
      setFields(
        option!.selected
          ? [...fields, option!.key as string]
          : fields.filter((key) => key !== option!.key)
      );
    },
    [fields, setFields]
  );

  return (
    <div>
      <Dropdown
        label="Time scale field (MUST contain string or milliseconds of Date)"
        options={dropdownOptions}
        onChange={onTimeDropdownChange}
        selectedKey={timeField}
        styles={dropdownStyles}
      />
      <Dropdown
        label="Y-axis fields"
        multiSelect
        options={dropdownOptions}
        onChange={onFieldsDropdownChange}
        selectedKeys={fields}
        styles={dropdownStyles}
      />
      <br />
      <FieldTable fields={fields} setFields={setFields} />
    </div>
  );
};

export default FieldPicker;
