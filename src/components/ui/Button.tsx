import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glow' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-[#18181B] hover:bg-[#27272A] text-white focus:ring-zinc-500 shadow-sm border border-zinc-800',
    secondary: 'bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 focus:ring-zinc-300 shadow-sm',
    glow: 'bg-[#1E1B18] text-[#FFE8D6] border border-[#FF6B35]/30 hover:border-[#FF6B35]/70 focus:ring-[#FF6B35] relative shadow-[0_0_15px_rgba(255,107,53,0.1)] hover:shadow-[0_0_20px_rgba(255,107,53,0.25)]',
    destructive: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 focus:ring-red-300',
    ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600 focus:ring-zinc-200'
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs font-semibold',
    md: 'px-5 py-2.5 text-sm font-semibold',
    lg: 'px-7 py-3.5 text-base font-semibold',
    icon: 'p-2.5 rounded-full'
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : leftIcon ? (
        <span className="mr-2 inline-flex items-center justify-center">{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon && (
        <span className="ml-2 inline-flex items-center justify-center">{rightIcon}</span>
      )}
    </button>
  );
};
