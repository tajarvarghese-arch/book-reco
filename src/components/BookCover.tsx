'use client';

import Image from 'next/image';

type BookCoverProps = {
  coverUrl: string | null | undefined;
  title: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: { width: 48, height: 72 },
  md: { width: 80, height: 120 },
  lg: { width: 128, height: 192 },
};

export default function BookCover({ coverUrl, title, size = 'md' }: BookCoverProps) {
  const { width, height } = sizeMap[size];
  const hasImage = coverUrl && coverUrl !== 'none';

  return (
    <div
      className="relative shrink-0 rounded-md overflow-hidden border border-[#e8e6dc] shadow-sm"
      style={{ width, height, background: '#e8e6dc' }}
    >
      {hasImage ? (
        <Image
          src={coverUrl}
          alt={title}
          width={width}
          height={height}
          className="object-cover w-full h-full"
          unoptimized
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-1.5 text-center bg-gradient-to-b from-[#e8e6dc] to-[#d4d2c8]">
          <svg width="20" height="24" viewBox="0 0 20 24" fill="none" className="mb-1 opacity-40">
            <rect x="2" y="1" width="16" height="22" rx="2" stroke="#141413" strokeWidth="1.5" fill="none"/>
            <line x1="6" y1="6" x2="14" y2="6" stroke="#141413" strokeWidth="1" opacity="0.3"/>
            <line x1="6" y1="9" x2="14" y2="9" stroke="#141413" strokeWidth="1" opacity="0.3"/>
            <line x1="6" y1="12" x2="11" y2="12" stroke="#141413" strokeWidth="1" opacity="0.3"/>
          </svg>
          <span className="text-[7px] text-[#141413] opacity-40 leading-tight" style={{fontFamily: 'var(--font-heading), Arial, sans-serif'}}>
            {title.substring(0, 24)}
          </span>
        </div>
      )}
    </div>
  );
}
