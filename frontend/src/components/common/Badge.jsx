import clsx from 'clsx';

const variants = {
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
};

export default function Badge({ children, variant = 'primary', className, dot = false }) {
  return (
    <span className={clsx('badge', variants[variant], className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />}
      {children}
    </span>
  );
}
