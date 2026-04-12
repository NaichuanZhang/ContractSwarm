import { cn } from "@/lib/utils";

interface ContractSwarmLogoProps {
  readonly className?: string;
  readonly size?: "sm" | "md" | "lg";
}

export function ContractSwarmLogo({
  className,
  size = "md",
}: ContractSwarmLogoProps) {
  const sizeMap = {
    sm: { icon: 20, text: "text-base" },
    md: { icon: 24, text: "text-lg" },
    lg: { icon: 32, text: "text-2xl" },
  };
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5 text-gold", className)}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Contract-Swarm logo"
      >
        {/* Shield outline */}
        <path
          d="M16 2L4 7V15C4 22.18 9.12 28.82 16 30C22.88 28.82 28 22.18 28 15V7L16 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.08"
        />
        {/* Center node */}
        <circle cx="16" cy="15" r="2" fill="currentColor" />
        {/* Top node */}
        <circle cx="16" cy="8" r="1.5" fill="currentColor" fillOpacity="0.8" />
        {/* Bottom-left node */}
        <circle cx="10.5" cy="20" r="1.5" fill="currentColor" fillOpacity="0.8" />
        {/* Bottom-right node */}
        <circle cx="21.5" cy="20" r="1.5" fill="currentColor" fillOpacity="0.8" />
        {/* Left node */}
        <circle cx="9" cy="13" r="1.5" fill="currentColor" fillOpacity="0.6" />
        {/* Right node */}
        <circle cx="23" cy="13" r="1.5" fill="currentColor" fillOpacity="0.6" />
        {/* Connection lines */}
        <line x1="16" y1="8" x2="16" y2="13" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.5" />
        <line x1="16" y1="17" x2="10.5" y2="20" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.5" />
        <line x1="16" y1="17" x2="21.5" y2="20" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.5" />
        <line x1="9" y1="13" x2="14" y2="15" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.5" />
        <line x1="23" y1="13" x2="18" y2="15" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.5" />
        <line x1="9" y1="13" x2="10.5" y2="20" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
        <line x1="23" y1="13" x2="21.5" y2="20" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
        <line x1="16" y1="8" x2="9" y2="13" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
        <line x1="16" y1="8" x2="23" y2="13" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
      </svg>
      <span
        className={cn(
          "font-heading font-semibold tracking-tight",
          s.text
        )}
      >
        Contract-Swarm
      </span>
    </div>
  );
}
