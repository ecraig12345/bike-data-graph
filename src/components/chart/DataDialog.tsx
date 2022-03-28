import React from 'react';
import { Dialog, IDialogProps, IDialogContentProps } from '@fluentui/react/lib/Dialog';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { ReadFileData } from '../../types';
import Table from '../basic/Table';
import { useStore } from '../../store/useStore';

export type DataDialogProps = {
  onDismiss: () => void;
  time: string;
  data: { [filePath: string]: ReadFileData };
};

const width = 450;
const modalProps: IDialogProps['modalProps'] = {
  isBlocking: false,
};
const tableClass = mergeStyles({
  // specificity yay...
  'tr td, tr th': { border: '1px solid gray', padding: '5px 8px' },
});

function formatValue(fieldName: string, value: string | number) {
  const numValue = Number(value);
  const isValueNaN = isNaN(numValue);
  if (/\btime/i.test(fieldName)) {
    // check if it's a full timestamp (all other time-related fields don't need converting)
    const date = new Date(value);
    if (!isNaN(date.getTime()) && date.getFullYear() > 2000) {
      return date.toLocaleString();
    }
  } else if (/(^|[^a-z])(lat|long)(itude)?\b/i.test(fieldName)) {
    // leave lat/long numbers with high precision
  } else if (/\bdistance\b/i.test(fieldName) && !isValueNaN) {
    // distance gets a little higher precision due to probably being in miles
    return numValue.toFixed(3);
  } else if (!isValueNaN) {
    return String(numValue.toFixed(1)).replace('.0', '');
  }
  return value;
}

const DataDialog: React.FunctionComponent<DataDialogProps> = (props) => {
  const { onDismiss, time, data } = props;
  const dialogContentProps = React.useMemo(
    (): IDialogContentProps => ({
      title: `Data at ${time}`,
      closeButtonAriaLabel: 'Close',
    }),
    [time]
  );
  // the dialog is modal so this won't change while it's open
  const filesSettings = useStore.getState().filesSettings;

  return (
    <Dialog
      hidden={false}
      onDismiss={onDismiss}
      dialogContentProps={dialogContentProps}
      modalProps={modalProps}
      maxWidth={width}
      minWidth={width}
    >
      {Object.entries(data).map(([filePath, record]) => (
        <div key={filePath}>
          <h3>{filesSettings[filePath].displayName}</h3>
          <Table className={tableClass}>
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(record).map(([field, value]) => (
                <tr key={field}>
                  <td>{field}</td>
                  <td>{formatValue(field, value)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ))}
    </Dialog>
  );
};

export default DataDialog;
