interface StatsCardProps {
    label: string;
    value: number;
    color: string;
    icon: string;
  }
  
  const StatsCard = ({ label, value, color, icon }: StatsCardProps) => {
    return (
      <div className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${color}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {label}
            </p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          </div>
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
    );
  };
  
  export default StatsCard;