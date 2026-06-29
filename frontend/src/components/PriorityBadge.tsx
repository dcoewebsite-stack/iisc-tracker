interface PriorityBadgeProps {
    score: number;
  }
  
  const PRIORITY_CONFIG: Record<number, { label: string; className: string }> = {
    1: { label: 'Overdue', className: 'bg-red-100 text-red-700' },
    2: { label: 'Follow-up Soon', className: 'bg-orange-100 text-orange-700' },
    3: { label: 'Follow-up This Week', className: 'bg-yellow-100 text-yellow-700' },
    4: { label: 'Visit Soon', className: 'bg-blue-100 text-blue-700' },
    5: { label: 'Visit This Week', className: 'bg-indigo-100 text-indigo-700' },
    6: { label: 'On Track', className: 'bg-green-100 text-green-700' },
  };
  
  const PriorityBadge = ({ score }: PriorityBadgeProps) => {
    const config = PRIORITY_CONFIG[score] ?? PRIORITY_CONFIG[6];
    return (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };
  
  export default PriorityBadge;