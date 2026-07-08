const getPriorityScore = (college) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = (date) => {
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  // Check all active (not done) follow-ups
  const activeFollowUps = (college.followUps || []).filter(f => !f.isDone && f.followUpDate);

  for (const fu of activeFollowUps) {
    const days = diffDays(new Date(fu.followUpDate));
    if (days < 0) return 1;  // overdue
  }
  for (const fu of activeFollowUps) {
    const days = diffDays(new Date(fu.followUpDate));
    if (days <= 3) return 2;
  }
  for (const fu of activeFollowUps) {
    const days = diffDays(new Date(fu.followUpDate));
    if (days <= 7) return 3;
  }

  // Visit date checks
  if (college.status === 'Upcoming' && college.visitDate) {
    const days = diffDays(new Date(college.visitDate));
    if (days < 0) return 1;
    if (days <= 3) return 4;
    if (days > 3 && days <= 7) return 5;
  }

  return 6;
};

module.exports = { getPriorityScore };