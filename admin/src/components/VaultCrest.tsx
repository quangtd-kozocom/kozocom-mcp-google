type IconProps = { className?: string };

export function VaultCrest({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="2.5"
        y="3.5"
        width="19"
        height="17"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
      <path
        d="M12 7.6V5.4M12 18.6v-2.2M7.6 12H5.4M18.6 12h-2.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
