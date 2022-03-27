import React from 'react';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { css } from '@fluentui/react/lib/Utilities';

// use a classname so it can be overridden more easily than style
const rootClass = mergeStyles({ color: 'reddark' });

const Error: React.FunctionComponent<React.HTMLAttributes<HTMLDivElement>> = (props) => {
  const { className, children, ...rest } = props;
  return (
    <div className={css(rootClass, className)} {...rest}>
      {children}
    </div>
  );
};

export default Error;
