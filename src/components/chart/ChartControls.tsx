import React from 'react';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import { State, useStore } from '../../store/useStore';
import TextFieldLazy, { TextFieldLazyProps } from '../basic/TextFieldLazy';

const styles = mergeStyleSets({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1em',
  },
  addSeriesText: { fontWeight: 'bold', marginBottom: '0.4em' },
  addSeries: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
  },
});

const textFieldStyles: Partial<TextFieldLazyProps['styles']> = {
  wrapper: { width: 200 },
  subComponentStyles: { label: { root: { paddingTop: 0 } } },
};

const chartSettingsSelector = (s: State) => s.chartSettings;

const ChartControls: React.FunctionComponent = () => {
  const { yBound } = useStore(chartSettingsSelector);

  const onYBoundChange = React.useCallback<NonNullable<TextFieldLazyProps['onChange']>>(
    (_ev, newValue) => {
      if (!newValue) {
        // clear the value
        useStore.getState().updateChartSettings({ yBound: undefined });
      } else if (!isNaN(Number(newValue))) {
        useStore.getState().updateChartSettings({ yBound: Number(newValue) });
      }
    },
    []
  );

  return (
    <div className={styles.root}>
      <h2>Chart options</h2>
      <div>
        <TextFieldLazy
          label="Y-axis max"
          placeholder="(default)"
          value={String(yBound ?? '')}
          onChange={onYBoundChange}
          styles={textFieldStyles}
        />
      </div>
      <div>
        <strong>Chart interaction:</strong> Pinch, scroll, or click and drag to zoom. Shift+drag to
        pan. Right click for more options.
      </div>
    </div>
  );
};

export default ChartControls;
