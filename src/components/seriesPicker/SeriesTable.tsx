import React from 'react';
import { IconButton } from '@fluentui/react/lib/Button';
import { cssColor, rgb2hex } from '@fluentui/react/lib/Color';
import { SpinButton, ISpinButtonProps, ISpinButtonStyles } from '@fluentui/react/lib/SpinButton';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { State, useStore } from '../../store/useStore';
import { Series } from '../../types';
import TextFieldLazy from '../basic/TextFieldLazy';
import Table from '../basic/Table';
import ColorInput, { ColorInputProps } from '../basic/ColorInput';

type SeriesTableRowProps = {
  series: Series;
};

/** ending headers are down, up, remove */
const headers = ['Field', 'From file', 'Label', 'Smooth', 'Color', '', '', ''] as const;

const className = mergeStyles({
  'th:first-child': { width: '20%' },
  'td:nth-child(2)': { width: '25%', maxWidth: '25%', fontSize: '0.85em' },
  'td:nth-last-child(2), td:nth-last-child(3)': { paddingRight: 0 },
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
  const { yField: name, smooth, filePath, label } = series;
  const fileDisplayName = useStore(
    React.useCallback((s) => s.filesSettings[filePath].displayName, [filePath])
  );
  const color = React.useMemo(() => {
    const c = cssColor(series.color);
    return c ? `#${rgb2hex(c.r, c.g, c.b)}` : series.color;
  }, [series.color]);

  const onLabelChange = React.useCallback(
    (_ev, newValue?: string) => useStore.getState().updateSeries(series, { label: newValue || '' }),
    [series]
  );

  const onSmoothChange = React.useCallback<NonNullable<ISpinButtonProps['onChange']>>(
    (_ev, newValue?) => useStore.getState().updateSeries(series, { smooth: Number(newValue || 0) }),
    [series]
  );

  const onColorChange = React.useCallback<NonNullable<ColorInputProps['onChange']>>(
    (ev) => {
      ev.target.value && useStore.getState().updateSeries(series, { color: ev.target.value });
    },
    [series]
  );

  const moveUp = React.useCallback(() => useStore.getState().reorderSeries(series, 'up'), [series]);
  const moveDown = React.useCallback(
    () => useStore.getState().reorderSeries(series, 'down'),
    [series]
  );
  const remove = React.useCallback(() => useStore.getState().removeSeries(series), [series]);

  return (
    <tr>
      <th style={{ color }}>{name}</th>
      <td>{fileDisplayName}</td>
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
        <ColorInput value={color} title="Color" onChange={onColorChange} />
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
    </tr>
  );
};

const seriesSelector = (s: State) => s.series;

const SeriesTable: React.FunctionComponent = () => {
  const allSeries = useStore(seriesSelector);

  if (!allSeries.length) {
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
        {allSeries.map((s) => (
          <SeriesTableRow key={s.filePath + s.yField} series={s} />
        ))}
      </tbody>
    </Table>
  );
};

export default SeriesTable;
