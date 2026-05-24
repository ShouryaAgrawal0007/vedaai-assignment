import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'easy' | 'medium' | 'hard' | 'neutral' | 'accent' | 'orange';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = ''
}) => {
  const baseStyle = 'inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-150';

  const variants = {
    easy: 'bg-[#ECFDF5] text-[#047857] border-[#D1FAE5]',
    medium: 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]',
    hard: 'bg-[#FFF5F5] text-[#E53E3E] border-[#FED7D7]',
    orange: 'bg-[#FFF3EB] text-[#FF5722] border-[#FFE0D3]',
    accent: 'bg-[#EEF2FF] text-[#4F46E5] border-[#E0E7FF]',
    neutral: 'bg-zinc-50 text-zinc-600 border-zinc-200'
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
