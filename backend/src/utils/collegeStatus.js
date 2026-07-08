const computeStatus = (college) => {
    // If manually marked completed, respect that
    if (college.status === 'Completed') return 'Completed';
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const followUps = college.followUps || [];
    const hasActiveFollowUp = followUps.some((f) => !f.isDone);
  
    if (!college.visitDate) return 'Upcoming';
  
    const visitDate = new Date(college.visitDate);
    visitDate.setHours(0, 0, 0, 0);
  
    if (visitDate > today) return 'Upcoming';
  
    // Visit passed
    if (followUps.length === 0) return 'Upcoming';
    if (hasActiveFollowUp) return 'Follow-up Pending';
  
    return 'Completed';
  };
  
  module.exports = { computeStatus };