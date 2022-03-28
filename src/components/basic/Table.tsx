import React from 'react';
import { mergeStyles, IStyle } from '@fluentui/react/lib/Styling';
import { css } from '@fluentui/react/lib/Utilities';

const nonCellStyles: IStyle = { padding: 0, verticalAlign: 'baseline' };
const commonStyles: IStyle = {
  margin: 0,
  border: 0,
  outline: 0,
  fontSize: '100%',
  background: 'transparent',
};

const rootClass = mergeStyles({
  width: '100%',
  borderCollapse: 'collapse',
  ...nonCellStyles,
  ...commonStyles,
  'caption, tbody, thead': { ...nonCellStyles, ...commonStyles },
  'td, th': {
    ...commonStyles,
    padding: '2px',
    textAlign: 'left',
    verticalAlign: 'middle',
  },
  'td:not(:last-child), th:not(:last-child)': { paddingRight: '12px' },
});

const Table: React.FunctionComponent<React.TableHTMLAttributes<HTMLTableElement>> = (props) => {
  const { className, children, ...rest } = props;

  return (
    <table className={css(rootClass, className)} {...rest}>
      {children}
    </table>
  );
};

export default Table;
