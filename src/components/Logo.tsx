import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  showTagline?: boolean;
  variant?: 'horizontal' | 'vertical' | 'icon';
  className?: string;
}

export const LogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 ${className}`}
      aria-label="Logo Trợ Lý Tìm Quà"
    >
      <defs>
        <linearGradient id="logoRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E82C4A" />
          <stop offset="50%" stopColor="#CF1B38" />
          <stop offset="100%" stopColor="#A81028" />
        </linearGradient>

        <linearGradient id="logoTopShine" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="logoRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>

        <linearGradient id="logoRibbonDepth" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.4" />
        </linearGradient>

        <linearGradient id="logoGoldGrad" x1="30%" y1="20%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="45%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>

        <filter id="logoShadow" x="-10%" y="-10%" width="125%" height="125%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#5C0615" floodOpacity="0.25" />
        </filter>
        <filter id="logoRibbonShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#6B0B1A" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Red Squircle Background with 3D Bevel Feel */}
      <rect
        x="14"
        y="14"
        width="172"
        height="172"
        rx="44"
        ry="44"
        fill="url(#logoRedGrad)"
        filter="url(#logoShadow)"
      />
      <rect
        x="15"
        y="15"
        width="170"
        height="170"
        rx="43"
        ry="43"
        fill="none"
        stroke="url(#logoTopShine)"
        strokeWidth="2"
      />

      {/* Stylized White Gift Ribbon Petal Loops */}
      <g filter="url(#logoRibbonShadow)">
        {/* Subtle diagonal inner depth */}
        <path
          d="M100 100 C110 75 135 60 152 76 C162 86 150 115 100 100 Z"
          fill="url(#logoRibbonDepth)"
          opacity="0.65"
        />
        <path
          d="M100 100 C90 125 65 140 48 124 C38 114 50 85 100 100 Z"
          fill="url(#logoRibbonDepth)"
          opacity="0.65"
        />

        {/* 4 Primary Gift Bow Petals */}
        {/* Top */}
        <path
          d="M100 100 C80 62 70 38 100 36 C130 38 120 62 100 100 Z"
          fill="url(#logoRibbonGrad)"
        />
        <path
          d="M100 90 C88 66 84 50 100 48 C116 50 112 66 100 90 Z"
          fill="#E82C4A"
          opacity="0.2"
        />

        {/* Bottom */}
        <path
          d="M100 100 C80 138 70 162 100 164 C130 162 120 138 100 100 Z"
          fill="url(#logoRibbonGrad)"
        />
        <path
          d="M100 110 C88 134 84 150 100 152 C116 150 112 134 100 110 Z"
          fill="#A81028"
          opacity="0.25"
        />

        {/* Left */}
        <path
          d="M100 100 C62 80 38 70 36 100 C38 130 62 120 100 100 Z"
          fill="url(#logoRibbonGrad)"
        />
        <path
          d="M90 100 C66 88 50 84 48 100 C50 116 66 112 90 100 Z"
          fill="#E82C4A"
          opacity="0.2"
        />

        {/* Right */}
        <path
          d="M100 100 C138 80 162 70 164 100 C162 130 138 120 100 100 Z"
          fill="url(#logoRibbonGrad)"
        />
        <path
          d="M110 100 C134 88 150 84 152 100 C150 116 134 112 110 100 Z"
          fill="#A81028"
          opacity="0.25"
        />
      </g>

      {/* Center Golden Knot / Button */}
      <circle cx="100" cy="100" r="16" fill="#A81028" opacity="0.3" />
      <circle cx="100" cy="100" r="14" fill="url(#logoGoldGrad)" filter="url(#logoShadow)" />
      <circle cx="100" cy="100" r="12" fill="none" stroke="#FEF08A" strokeWidth="1.2" opacity="0.75" />
      <ellipse
        cx="95"
        cy="95"
        rx="3.5"
        ry="2.5"
        transform="rotate(-30 95 95)"
        fill="#FFFFFF"
        opacity="0.9"
      />
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = true,
  variant = 'horizontal',
  className = '',
}) => {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 32
      : size === 'md'
      ? 42
      : size === 'lg'
      ? 52
      : 64;

  if (variant === 'icon' || !showText) {
    return <LogoIcon size={pixelSize} className={className} />;
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
        <LogoIcon size={pixelSize} className="hover:scale-105 transition-transform" />
        <div className="flex flex-col items-center">
          <span className="font-extrabold text-xl leading-tight text-[#b21e36] tracking-tight">
            Trợ Lý Tìm Quà
          </span>
          {showTagline && (
            <span className="text-[10px] text-[#5a4041] font-semibold tracking-wider uppercase mt-0.5">
              Gợi ý chuẩn gu • TikTok & Shopee
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default: Horizontal
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoIcon size={pixelSize} className="hover:scale-105 transition-transform" />
      <div className="flex flex-col">
        <span
          className={`font-extrabold leading-tight text-[#b21e36] tracking-tight transition-colors ${
            pixelSize >= 48 ? 'text-2xl' : pixelSize >= 40 ? 'text-[19px]' : 'text-base'
          }`}
        >
          Trợ Lý Tìm Quà
        </span>
        {showTagline && (
          <span className="text-[10px] text-[#5a4041] font-semibold tracking-wider uppercase hidden sm:inline">
            Gợi ý chuẩn gu • TikTok & Shopee
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
