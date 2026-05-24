import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#18181B] tracking-wide uppercase">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-zinc-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-[#FFFFFF] border text-zinc-900 placeholder-zinc-400 text-sm rounded-xl py-3 transition-all duration-150 focus:outline-none focus:ring-2
            ${icon ? 'pl-11 pr-4' : 'px-4'} 
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
              : 'border-zinc-200 hover:border-zinc-300 focus:border-zinc-950 focus:ring-zinc-100'
            } 
            ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-zinc-500 mt-0.5">{helperText}</span>
      ) : null}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-xs font-semibold text-[#18181B] tracking-wide uppercase">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full bg-[#FFFFFF] border text-zinc-900 placeholder-zinc-400 text-sm rounded-xl px-4 py-3 min-h-[100px] transition-all duration-150 focus:outline-none focus:ring-2
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
            : 'border-zinc-200 hover:border-zinc-300 focus:border-zinc-950 focus:ring-zinc-100'
          } 
          ${className}`}
        {...props}
      />
      {error ? (
        <span className="text-xs text-red-500 font-medium mt-0.5">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-zinc-500 mt-0.5">{helperText}</span>
      ) : null}
    </div>
  );
};
