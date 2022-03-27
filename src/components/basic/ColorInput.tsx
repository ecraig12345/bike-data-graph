import React from 'react';

export type ColorInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'defaultValue' | 'value'
> & {
  value: string;
};

/**
 * Wrapper for `<input type="color">` which acts as uncontrolled while open and only notifies
 * of changes when closed (reducing expensive graph updates).
 */
const ColorInput: React.FunctionComponent<ColorInputProps> = (props) => {
  const {
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

  const onFocus = React.useCallback<Required<ColorInputProps>['onFocus']>(
    (ev) => {
      propsOnFocus?.(ev);
      setHasFocus(true);
      setInternalValue(propsValue || '');
    },
    [propsOnFocus, propsValue]
  );

  const onBlur = React.useCallback<Required<ColorInputProps>['onBlur']>(
    (ev) => {
      propsOnBlur?.(ev);
      propsOnChange?.(ev);
      setHasFocus(false);
    },
    [propsOnBlur, propsOnChange]
  );

  const onChange = React.useCallback<Required<ColorInputProps>['onChange']>((ev) => {
    setInternalValue(ev.target.value || '');
  }, []);

  return (
    <input
      type="color"
      {...rest}
      value={value}
      onBlur={onBlur}
      onChange={onChange}
      onFocus={onFocus}
    />
  );
};

export default ColorInput;
