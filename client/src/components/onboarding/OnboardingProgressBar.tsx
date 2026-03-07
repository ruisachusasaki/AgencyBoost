interface OnboardingProgressBarProps {
  percent: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export default function OnboardingProgressBar({ percent, showLabel = false, size = "sm" }: OnboardingProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const heightClass = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className="flex items-center gap-2 w-full">
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className="h-full bg-[hsl(179,100%,39%)] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{clamped}%</span>
      )}
    </div>
  );
}
