import React from 'react';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { TextField, ITextFieldProps } from '@fluentui/react/lib/TextField';
import { css } from '@fluentui/react/lib/Utilities';

export type TextFieldLazyProps = Omit<ITextFieldProps, 'defaultValue' | 'value'> & {
  value: string;
};

const rootClass = mergeStyles({
  'input[type="number"]::-webkit-outer-spin-button,input[type="number"]::-webkit-inner-spin-button':
    {
      '-webkit-appearance': 'none',
      margin: 0,
    },
  'input[type="number"]': {
    '-moz-appearance': 'textfield',
  },
});

/**
 * TextField wrapper which is controlled (takes `value` prop only) but is "lazy" about notifying
 * of edits: it tracks state internally while focused and only calls `onChange` on blur.
 *
 * Motivation: often in this app, updating a TextField will update a chart, and doing that
 * on every keystroke is noticeably very slow for larger data sets.
 */
const TextFieldLazy: React.FunctionComponent<TextFieldLazyProps> = (props) => {
  const {
    className,
    onBlur: propsOnBlur,
    onFocus: propsOnFocus,
    onChange: propsOnChange,
    value: propsValue,
    ...rest
  } = props;

  const [internalValue, setInternalValue] = React.useState<string>();
  const [hasFocus, setHasFocus] = React.useState(false);
  const value = React.useMemo(
    () => (hasFocus ? internalValue : propsValue),
    [hasFocus, internalValue, propsValue]
  );

  const onFocus = React.useCallback<Required<ITextFieldProps>['onFocus']>(
    (ev) => {
      propsOnFocus?.(ev);
      setHasFocus(true);
      setInternalValue(propsValue || '');
    },
    [propsOnFocus, propsValue]
  );

  const onBlur = React.useCallback<Required<ITextFieldProps>['onBlur']>(
    (ev) => {
      propsOnBlur?.(ev);
      setHasFocus(false);
      propsOnChange?.(ev, internalValue);
    },
    [internalValue, propsOnBlur, propsOnChange]
  );

  const onChange = React.useCallback<Required<ITextFieldProps>['onChange']>((ev, newValue) => {
    setInternalValue(newValue);
  }, []);

  return (
    <TextField
      {...rest}
      className={css(rootClass, className)}
      value={value}
      onBlur={onBlur}
      onChange={onChange}
      onFocus={onFocus}
    />
  );
};

export default TextFieldLazy;
