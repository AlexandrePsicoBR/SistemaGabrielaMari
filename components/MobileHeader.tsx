import React from 'react';

interface MobileHeaderProps {
  onMenuClick?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="md:hidden h-16 bg-white border-b border-[#f3f2f1] flex items-center justify-between px-4 shrink-0 z-20">
      <span className="font-serif font-bold text-lg text-text-main">Gabriela Mari</span>
      <button className="text-text-main" onClick={onMenuClick}>
        <span className="material-symbols-outlined">menu</span>
      </button>
    </header>
  );
};

export default MobileHeader;
