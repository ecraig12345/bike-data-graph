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
import TextFieldLazy, { TextFieldLazyProps } from '../basic/TextFieldLazy';
import Table from '../basic/Table';

type FilesTableRowProps = FileInfo & FileSettings;

/** last header is remove */
const headers = ['Name', 'Display name', 'Time field', 'Offset (min)', ''] as const;

const msInMinute = 60 * 1000;

const className = mergeStyles({
  // original name
  'td:first-child': { maxWidth: '35%', fontSize: '0.95em' },
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
  const onDropdownChange = React.useCallback<NonNullable<IDropdownProps['onChange']>>(
    (_ev, option) => {
      useStore.getState().updateFileSettings(filePath!, { timeField: option!.key as string });
    },
    [filePath]
  );

  const onOffsetChange = React.useCallback<NonNullable<TextFieldLazyProps['onChange']>>(
    (_ev, newValue) => {
      if (newValue && !isNaN(Number(newValue))) {
        useStore
          .getState()
          .updateFileSettings(filePath!, { offset: Math.round(Number(newValue) * msInMinute) });
      }
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
      <td>
        <TextFieldLazy
          title="Offset"
          value={String(Number(offset) / msInMinute || 0)}
          onChange={onOffsetChange}
          type="number"
        />
      </td>
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
          {headers.map((h, i) => (
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
