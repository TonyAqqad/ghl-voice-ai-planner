import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const base = 'btn relative overflow-hidden transition-transform duration-150 active:translate-y-[1px]';
const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  destructive: 'btn-destructive',
};
const sizeClass: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  ...props
}) => {
  return (
    <button
      className={[
        base,
        variantClass[variant],
        sizeClass[size],
        fullWidth ? 'w-full' : '',
        'group',
        className,
      ].join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {/* glossy animated overlay */}
      <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="absolute -inset-1 bg-gradient-to-tr from-white/10 to-transparent" />
      </span>
      {loading && <span className="loading mr-2" />}
      {children}
    </button>
  );
};

export default Button;


