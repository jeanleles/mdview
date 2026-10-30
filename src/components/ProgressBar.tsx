"use client";

interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const value = Math.min(100, Math.max(0, Math.floor(progress)));

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-2 bg-gray-200 dark:bg-gray-800"
      role="progressbar"
      aria-label="Progresso de leitura"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className="h-full bg-blue-700 transition-[width] duration-100"
        style={{ width: `${value}%` }}
      />
      <span className="sr-only">{value}%</span>
    </div>
  );
}
