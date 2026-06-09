type IconProps = { className?: string };

export function EmptyVault({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <rect x="10" y="14" width="76" height="68" rx="6" stroke="currentColor" strokeWidth="2" />
      <rect x="10" y="14" width="76" height="14" rx="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="48" cy="54" r="17" stroke="currentColor" strokeWidth="2" />
      <circle cx="48" cy="54" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M48 41v-5M48 72v-5M61 54h5M30 54h5M57.2 44.8l3.5-3.5M35.3 66.7l3.5-3.5M57.2 63.2l3.5 3.5M35.3 41.3l3.5 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
