import React from 'react';
import { IconButton } from '@fluentui/react/lib/Button';
import { SpinButton, ISpinButtonProps, ISpinButtonStyles } from '@fluentui/react/lib/SpinButton';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { State, useStore } from '../../store/useStore';
import { Series } from '../../types';
import TextFieldLazy from '../basic/TextFieldLazy';
import Table from '../basic/Table';

type SeriesTableRowProps = {
  series: Series;
};

const className = mergeStyles({
  'th:first-child': { width: 100, textAlign: 'right' },
});

const spinButtonStyles: Partial<ISpinButtonStyles> = {
  root: { width: 70, minWidth: 70 },
  spinButtonWrapper: { minWidth: 0 },
  input: { minWidth: 0 },
};

const downIconProps = { iconName: 'ChevronDown' };
const upIconProps = { iconName: 'ChevronUp' };
const removeIconProps = { iconName: 'Cancel' };

const SeriesTableRow: React.FunctionComponent<SeriesTableRowProps> = (props) => {
  const { series } = props;
  const { yField: name, color, smooth, filePath, label } = series;
  const fileDisplayName = useStore(
    React.useCallback((s) => s.filesSettings[filePath].displayName, [filePath])
  );
  const { reorderSeries, removeSeries, updateSeries } = useStore.getState();

  const onLabelChange = React.useCallback(
    (_ev, newValue?: string) => updateSeries(series, { label: newValue || '' }),
    [series, updateSeries]
  );

  const onSmoothChange: ISpinButtonProps['onChange'] = React.useCallback(
    (_ev, newValue?) => updateSeries(series, { smooth: Number(newValue || 0) }),
    [series, updateSeries]
  );
  const moveUp = React.useCallback(() => reorderSeries(series, 'up'), [reorderSeries, series]);
  const moveDown = React.useCallback(() => reorderSeries(series, 'down'), [reorderSeries, series]);
  const remove = React.useCallback(() => removeSeries(series), [removeSeries, series]);

  return (
    <tr>
      <th style={{ color }}>{name}</th>
      <td>
        <TextFieldLazy title="Label" value={label} onChange={onLabelChange} />
      </td>
      <td>
        <SpinButton
          value={String(smooth)}
          onChange={onSmoothChange}
          min={0}
          max={10}
          title="Smooth data (interval before and after in seconds)"
          styles={spinButtonStyles}
        />
      </td>
      <td>
        <IconButton onClick={moveDown} title="Move down" iconProps={downIconProps} />
      </td>
      <td>
        <IconButton onClick={moveUp} title="Move up" iconProps={upIconProps} />
      </td>
      <td>
        <IconButton onClick={remove} title="Remove" iconProps={removeIconProps} />
      </td>
      <td>{fileDisplayName}</td>
    </tr>
  );
};

const seriesSelector = (s: State) => s.series;

const SeriesTable: React.FunctionComponent = () => {
  const allSeries = useStore(seriesSelector);

  return (
    <Table className={className}>
      <thead>
        <tr>
          {['Field', 'Label', 'Smooth', 'Down', 'Up', 'Remove', 'From'].map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {allSeries.map((s) => (
          <SeriesTableRow key={s.filePath + s.yField} series={s} />
        ))}
      </tbody>
    </Table>
  );
};

export default SeriesTable;
