import React from 'react';
import { IconButton } from '@fluentui/react/lib/Button';
import { mergeStyles } from '@fluentui/react/lib/Styling';

type FieldTableRowProps = {
  name: string;
  moveDown?: () => void;
  moveUp?: () => void;
  remove: () => void;
};

const className = mergeStyles({
  'td, th': { padding: 2, paddingRight: 10, textAlign: 'center' },
  'th:first-child': { width: 100, textAlign: 'right' },
});

const downIconProps = { iconName: 'ChevronDown' };
const upIconProps = { iconName: 'ChevronUp' };
const removeIconProps = { iconName: 'Cancel' };

const FieldTableRow: React.FunctionComponent<FieldTableRowProps> = (props) => {
  const { name, moveUp, moveDown, remove } = props;
  return (
    <tr>
      <th>{name}</th>
      <td>{moveUp && <IconButton onClick={moveUp} iconProps={upIconProps} />}</td>
      <td>{moveDown && <IconButton onClick={moveDown} iconProps={downIconProps} />}</td>
      <td>
        <IconButton onClick={remove} iconProps={removeIconProps} />
      </td>
    </tr>
  );
};

export type FieldTableProps = {
  fields: string[];
  setFields: (fields: string[]) => void;
};

const moveField = (fields: string[], i: number, action: 'up' | 'down' | 'remove') => {
  const newFields = [...fields];
  const field = newFields.splice(i, 1)[0];
  if (action !== 'remove') {
    newFields.splice(action === 'up' ? i - 1 : i + 1, 0, field);
  }
  return newFields;
};

const FieldTable: React.FunctionComponent<FieldTableProps> = (props) => {
  const { fields, setFields } = props;

  return (
    <table className={className}>
      <thead>
        <tr>
          {['Field', 'Up', 'Down', 'Remove'].map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {fields.map((f, i) => (
          <FieldTableRow
            key={f}
            name={f}
            moveUp={i !== 0 ? () => setFields(moveField(fields, i, 'up')) : undefined}
            moveDown={
              i !== fields.length - 1 ? () => setFields(moveField(fields, i, 'down')) : undefined
            }
            remove={() => setFields(moveField(fields, i, 'remove'))}
          />
        ))}
      </tbody>
    </table>
  );
};

export default FieldTable;
