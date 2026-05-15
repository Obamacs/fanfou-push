"use client";

interface OptionButtonProps {
  value: string;
  label: string;
  isSelected: boolean;
  onClick: (value: string) => void;
  className?: string;
}

export function OptionButton({
  value,
  label,
  isSelected,
  onClick,
  className = "",
}: OptionButtonProps) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`p-4 rounded-lg border-2 transition font-medium ${className} ${
        isSelected
          ? "border-[#FF2442] bg-[#FFF0F3] text-[#FF2442]"
          : "border-[#F0E4E0] bg-white text-[#2D2420] hover:border-[#FF6B35]/30"
      }`}
    >
      {label}
    </button>
  );
}

interface OptionGridProps {
  options: Array<{ value: string; label: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
  columns?: number;
}

export function OptionGrid({
  options,
  selectedValue,
  onSelect,
  columns = 2,
}: OptionGridProps) {
  return (
    <div className={`grid ${columns === 3 ? "grid-cols-3" : "grid-cols-2"} gap-3`}>
      {options.map((option) => (
        <OptionButton
          key={option.value}
          value={option.value}
          label={option.label}
          isSelected={selectedValue === option.value}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}

interface StepSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function StepSection({ title, subtitle, children }: StepSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#2D2420] mb-2">{title}</h2>
        {subtitle && <p className="text-sm text-[#B8A099]">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
