"use client";

interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const value = Math.min(100, Math.max(0, Math.floor(progress)));
  const circumference = 2 * Math.PI * 17;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 dark:bg-gray-900 dark:ring-white/10"
      role="progressbar"
      aria-label="Progresso de leitura"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value}% lido`}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 40 40"
      >
        <circle
          className="text-gray-300 dark:text-gray-700"
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <circle
          className="text-blue-700 transition-[stroke-dashoffset] duration-100 dark:text-blue-400"
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <span className="relative text-xs font-semibold text-gray-900 dark:text-gray-100">
        {value}%
      </span>
    </div>
  );
}
