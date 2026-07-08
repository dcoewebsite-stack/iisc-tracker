import type { College } from '../types/college';
import PriorityBadge from './PriorityBadge';
import { timeAgo } from '../utils/formatTime';
import { getPriorityScore } from '../utils/priority';

const STATUS_CONFIG = {
  'Upcoming': {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Upcoming',
  },
  'Follow-up Pending': {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Follow-up Pending',
  },
  'Completed': {
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    label: 'Completed',
  },
};

interface CollegeCardProps {
  college: College;
  onClick: () => void;
}

const CollegeCard = ({ college, onClick }: CollegeCardProps) => {
  const priority = getPriorityScore(college);
  const statusConfig = STATUS_CONFIG[college.status] ?? STATUS_CONFIG['Upcoming'];
  const activeFollowUps = college.followUps?.filter((f) => !f.isDone) ?? [];
  const doneFollowUps = college.followUps?.filter((f) => f.isDone) ?? [];

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-4 shadow-sm border active:scale-[0.98] transition-transform cursor-pointer
        ${statusConfig.bg} ${statusConfig.border}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-ink flex-1 min-w-0 truncate">
          {college.collegeName}
        </h3>
        <PriorityBadge score={priority} />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {college.assignedEmployee && (
          <span className="text-xs text-sage">{college.assignedEmployee}</span>
        )}
        {college.assignedEmployee && (
          <span className="text-xs text-sage">·</span>
        )}
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig.badge}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Contact person */}
      {college.contactPerson && (
        <p className="text-xs text-sage mb-2">
          Contact: <span className="font-medium">{college.contactPerson}</span>
        </p>
      )}

      {/* Visit date */}
      {college.visitDate && (
        <p className="text-xs text-sage mb-2">
          Visit: {new Date(college.visitDate).toLocaleDateString()}
        </p>
      )}

      {/* Active follow-ups */}
      {activeFollowUps.length > 0 && (
        <div className="space-y-1 mb-2">
          {activeFollowUps.map((fu, i) => (
            <div key={fu._id} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                Follow-up {activeFollowUps.length > 1 ? `#${i + 1}` : ''}:{' '}
                {fu.followUpDate
                  ? new Date(fu.followUpDate).toLocaleDateString()
                  : 'No date set'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Done follow-ups (compact) */}
      {doneFollowUps.length > 0 && (
        <p className="text-xs text-sage/70 mb-2">
          ✓ {doneFollowUps.length} follow-up{doneFollowUps.length > 1 ? 's' : ''} completed
        </p>
      )}

      {/* Last updated */}
      <p className="text-xs text-sage/70 border-t border-black/5 pt-2 mt-2">
        Last updated by{' '}
        <span className="font-medium text-sage">{college.lastUpdatedBy || 'Unknown'}</span>
        {' '}· {timeAgo(college.updatedAt)}
      </p>
    </div>
  );
};

export default CollegeCard;