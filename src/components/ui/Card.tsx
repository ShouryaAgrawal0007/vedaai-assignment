import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = true,
  padded = true,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-all duration-200 
        ${hoverEffect ? 'hover:shadow-md hover:border-[#D1D5DB]' : ''} 
        ${padded ? 'p-6' : ''} 
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
