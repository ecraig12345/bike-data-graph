import React from 'react';
import {
  Dropdown,
  IDropdownOption,
  IDropdownProps,
  IDropdownStyles,
} from '@fluentui/react/lib/Dropdown';
import { IconButton } from '@fluentui/react/lib/Button';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { State, useStore } from '../../store/useStore';
import { FileInfo, FileSettings } from '../../types';
import TextFieldLazy from '../basic/TextFieldLazy';
import Table from '../basic/Table';

type FilesTableRowProps = FileInfo & FileSettings;

const className = mergeStyles({
  // original name
  'td:first-child': { width: '30%', fontSize: '0.9em' },
  // display name
  'td:nth-child(2)': { width: '30%' },
  // time field
  'td:nth-child(3)': { width: '20%' },
});
const dropdownStyles: Partial<IDropdownStyles> = {
  // dropdown: { width: 150 },
  dropdownOptionText: { overflow: 'visible', whiteSpace: 'normal' },
  dropdownItem: { height: 'auto' },
};

const removeIconProps = { iconName: 'Cancel' };

const FilesTableRow: React.FunctionComponent<FilesTableRowProps> = (props) => {
  const { allFields, displayName, filePath, timeField, offset } = props;

  const onDisplayNameChange = React.useCallback(
    (_ev, newValue?: string) =>
      useStore.getState().updateFileSettings(filePath, { displayName: newValue || '' }),
    [filePath]
  );

  const dropdownOptions = React.useMemo(
    () => allFields?.map((f): IDropdownOption => ({ key: f, text: f })),
    [allFields]
  );
  const onDropdownChange = React.useCallback<Required<IDropdownProps>['onChange']>(
    (_ev, option) => {
      useStore.getState().updateFileSettings(filePath!, { timeField: option!.key as string });
    },
    [filePath]
  );

  const remove = React.useCallback(() => useStore.getState().removeFile(filePath), [filePath]);

  return (
    <tr>
      <td>{filePath}</td>
      <td>
        <TextFieldLazy title="Display name" value={displayName} onChange={onDisplayNameChange} />
      </td>
      <td>
        <Dropdown
          title="Time field"
          options={dropdownOptions}
          onChange={onDropdownChange}
          selectedKey={timeField}
          styles={dropdownStyles}
        />
      </td>
      <td>{offset || '...'}</td>
      <td>
        <IconButton onClick={remove} title="Remove" iconProps={removeIconProps} />
      </td>
    </tr>
  );
};

const filesSelector = (s: State) => s.files;
const filesSettingsSelector = (s: State) => s.filesSettings;

const FilesTable: React.FunctionComponent = () => {
  const files = useStore(filesSelector);
  const filesSettings = useStore(filesSettingsSelector);

  if (!Object.keys(files).length) {
    return null;
  }

  return (
    <Table className={className}>
      <thead>
        <tr>
          {['Name', 'Display name', 'Time field', 'Time offset', ''].map((h, i) => (
            <th key={h || i}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.keys(files).map((filePath) => (
          <FilesTableRow key={filePath} {...files[filePath]} {...filesSettings[filePath]} />
        ))}
      </tbody>
    </Table>
  );
};

export default FilesTable;
