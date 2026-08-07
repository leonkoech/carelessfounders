type LoopLogoProps = {
  size?: number;
  withWordmark?: boolean;
  wordmarkClassName?: string;
};

export function LoopMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Loop logo"
    >
      <rect width="32" height="32" rx="8" fill="#FF2F00" />
      {/* open loop with arrowhead — money circulating */}
      <path
        d="M16 7.5a8.5 8.5 0 1 1-8.36 6.9"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M4.6 15.9l3.1-2.4 2.4 3.1"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="2.4" fill="white" />
    </svg>
  );
}

export default function LoopLogo({
  size = 32,
  withWordmark = true,
  wordmarkClassName = "text-lg font-semibold tracking-tight",
}: LoopLogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LoopMark size={size} />
      {withWordmark && <span className={wordmarkClassName}>Loop</span>}
    </span>
  );
}
