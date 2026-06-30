import type { College } from '../types/college';
import PriorityBadge from './PriorityBadge';
import { timeAgo } from '../utils/formatTime';

const getPriorityScore = (college: College): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (college.followUpDate) {
    const days = diffDays(college.followUpDate);
    if (days < 0) return 1;
    if (days <= 3) return 2;
    if (days <= 7) return 3;
  }

  if (college.status === 'Upcoming' && college.visitDate) {
    const days = diffDays(college.visitDate);
    if (days >= 0 && days <= 3) return 4;
    if (days > 3 && days <= 7) return 5;
  }

  return 6;
};

interface CollegeCardProps {
  college: College;
  onClick: () => void;
}

const CollegeCard = ({ college, onClick }: CollegeCardProps) => {
  const priority = getPriorityScore(college);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm border border-warmgray active:scale-[0.98] transition-transform cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-ink flex-1 min-w-0 truncate">
          {college.collegeName}
        </h3>
        <PriorityBadge score={priority} />
      </div>

      <div className="flex items-center gap-2 text-xs text-sage mb-2">
        <span>{college.assignedEmployee}</span>
        <span>·</span>
        <span
          className={
            college.status === 'Visited'
              ? 'text-green-700 font-medium'
              : 'text-forest font-medium'
          }
        >
          {college.status}
        </span>
      </div>

      {college.followUpDate && (
        <p className="text-xs text-sage/70 mb-1">
          Follow-up: {new Date(college.followUpDate).toLocaleDateString()}
        </p>
      )}

      <p className="text-xs text-sage/70 border-t border-warmgray pt-2 mt-2">
        Last updated by <span className="font-medium text-sage">{college.lastUpdatedBy || 'Unknown'}</span> · {timeAgo(college.updatedAt)}
      </p>
    </div>
  );
};

export default CollegeCard;