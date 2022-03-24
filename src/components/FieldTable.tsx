import React from 'react';
import { IconButton } from '@fluentui/react/lib/Button';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import shallow from 'zustand/shallow';
import { State, useStore } from '../utils/useStore';

type FieldTableRowProps = {
  name: string;
  color: string;
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
  const { name, color, moveUp, moveDown, remove } = props;
  return (
    <tr>
      <th style={{ color }}>{name}</th>
      <td>{moveUp && <IconButton onClick={moveUp} iconProps={upIconProps} />}</td>
      <td>{moveDown && <IconButton onClick={moveDown} iconProps={downIconProps} />}</td>
      <td>
        <IconButton onClick={remove} iconProps={removeIconProps} />
      </td>
    </tr>
  );
};

const selector = (s: State) => ({
  series: s.series,
  reorderSeries: s.reorderSeries,
  removeSeries: s.removeSeries,
});

const FieldTable: React.FunctionComponent = () => {
  const { series, reorderSeries, removeSeries } = useStore(selector, shallow);

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
        {series.map((s) => (
          <FieldTableRow
            key={s.filePath + s.yField}
            name={s.yField}
            color={s.color}
            moveUp={() => reorderSeries(s, 'up')}
            moveDown={() => reorderSeries(s, 'down')}
            remove={() => removeSeries(s)}
          />
        ))}
      </tbody>
    </table>
  );
};

export default FieldTable;
