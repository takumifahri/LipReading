export default function SiReactIcon({ size = 20, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" fill="currentColor" r="2.05" />
      <ellipse cx="12" cy="12" rx="10" ry="4.15" stroke="currentColor" strokeWidth="1.45" />
      <ellipse cx="12" cy="12" rx="10" ry="4.15" stroke="currentColor" strokeWidth="1.45" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4.15" stroke="currentColor" strokeWidth="1.45" transform="rotate(120 12 12)" />
    </svg>
  );
}
