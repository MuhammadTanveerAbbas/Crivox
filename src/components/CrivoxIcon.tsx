interface CrivoxIconProps {
  size?: number;
  className?: string;
}

/**
 * Crivox brand icon — speech bubble with a lightning bolt.
 * Drop-in replacement for the generic MessageSquare logo.
 */
const CrivoxIcon = ({ size = 28, className = "" }: CrivoxIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    width={size}
    height={size}
    className={className}
    aria-label="Crivox"
  >
    <defs>
      <linearGradient id="crivox-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#crivox-bg)" />
    <path
      d="M6 9a2.5 2.5 0 0 1 2.5-2.5h15A2.5 2.5 0 0 1 26 9v9a2.5 2.5 0 0 1-2.5 2.5h-4.2l-3.3 3.8-3.3-3.8H8.5A2.5 2.5 0 0 1 6 18V9z"
      fill="white"
      opacity="0.15"
    />
    <path
      d="M6 9a2.5 2.5 0 0 1 2.5-2.5h15A2.5 2.5 0 0 1 26 9v9a2.5 2.5 0 0 1-2.5 2.5h-4.2l-3.3 3.8-3.3-3.8H8.5A2.5 2.5 0 0 1 6 18V9z"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M17.5 8.5l-3.8 5.2h3l-2.2 5.8 5.5-6.8h-3.2z" fill="white" />
  </svg>
);

export default CrivoxIcon;
