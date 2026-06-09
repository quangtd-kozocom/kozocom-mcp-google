type IconProps = { className?: string };

export function SheetIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9h16M4 14h16M10 3v18" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
