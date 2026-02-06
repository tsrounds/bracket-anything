interface ConfidenceBadgeProps {
  confidence: number;
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);

  let bgColor: string;
  let textColor: string;
  let label: string;

  if (confidence >= 0.85) {
    bgColor = 'bg-green-100';
    textColor = 'text-green-800';
    label = 'High';
  } else if (confidence >= 0.7) {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-800';
    label = 'Medium';
  } else if (confidence >= 0.5) {
    bgColor = 'bg-orange-100';
    textColor = 'text-orange-800';
    label = 'Low';
  } else {
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
    label = 'Very Low';
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bgColor} ${textColor}`}>
        {label} {pct}%
      </span>
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            confidence >= 0.85
              ? 'bg-green-500'
              : confidence >= 0.7
              ? 'bg-yellow-500'
              : confidence >= 0.5
              ? 'bg-orange-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
