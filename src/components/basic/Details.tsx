import React from 'react';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { css } from '@fluentui/react/lib/Utilities';

const rootClass = mergeStyles({
  paddingLeft: '1em',
  '> summary': { marginLeft: '-1em', marginBottom: '0.5em' },
});

export type DetailsProps = React.DetailsHTMLAttributes<HTMLDetailsElement> & {
  summary: string;
  onOpenChange?: (ev: React.MouseEvent<HTMLElement>, newIsOpen: boolean) => void;
  defaultIsOpen?: boolean;
};

const Details: React.FunctionComponent<DetailsProps> = (props) => {
  // The internal isOpen/onClick handling mimics uncontrolled behavior.
  // If `open` is provided it will be used instead.
  const { summary, children, className, defaultIsOpen, onOpenChange, ...rest } = props;
  const [isOpen, setIsOpen] = React.useState(defaultIsOpen);

  const onClick = (ev: React.MouseEvent<HTMLElement>) => {
    // Work around a React bug (regardless of whether controlled or uncontrolled)
    // https://github.com/facebook/react/issues/15486
    ev.preventDefault();

    const newIsOpen = !isOpen;
    onOpenChange?.(ev, newIsOpen);
    setIsOpen(newIsOpen);
  };

  return (
    <details className={css(className, rootClass)} open={isOpen} {...rest}>
      <summary onClick={onClick}>{summary}</summary>
      {children}
    </details>
  );
};

export default Details;
