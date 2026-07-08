import type { College } from '../types/college';

export const getPriorityScore = (college: College): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const activeFollowUps = (college.followUps || []).filter(
    (f) => !f.isDone && f.followUpDate
  );

  for (const fu of activeFollowUps) {
    if (diffDays(fu.followUpDate!) < 0) return 1;
  }
  for (const fu of activeFollowUps) {
    if (diffDays(fu.followUpDate!) <= 3) return 2;
  }
  for (const fu of activeFollowUps) {
    if (diffDays(fu.followUpDate!) <= 7) return 3;
  }

  if (college.status === 'Upcoming' && college.visitDate) {
    const days = diffDays(college.visitDate);
    if (days < 0) return 1;
    if (days <= 3) return 4;
    if (days > 3 && days <= 7) return 5;
  }

  return 6;
};