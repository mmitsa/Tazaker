import clsx from 'clsx';
import { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      type = 'text',
      placeholder,
      disabled = false,
      required = false,
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx('w-full', containerClassName)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-danger-500 mr-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx(
            'input',
            error && 'input-error',
            disabled && 'bg-gray-100 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {(error || helperText) && (
          <p className={clsx('text-xs mt-1', error ? 'text-danger-600' : 'text-gray-500')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
