const College = require('../models/College');
const AuditLog = require('../models/AuditLog');
const { getPriorityScore } = require('../utils/priorityUtils');
const { computeStatus } = require('../utils/collegeStatus');

// GET /api/colleges
const getColleges = async (req, res) => {
  try {
    const { search, status, employee } = req.query;
    const query = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.collegeName = { $regex: escaped, $options: 'i' };
    }
    if (status) query.status = status;
    if (employee) {
      query.assignedEmployee = {
        $regex: employee.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i',
      };
    }

    const colleges = await College.find(query);
    colleges.sort((a, b) => getPriorityScore(a) - getPriorityScore(b));

    res.json({ success: true, count: colleges.length, data: colleges });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/colleges/stats
const getDashboardStats = async (req, res) => {
  try {
    const colleges = await College.find();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    const stats = {
      total: colleges.length,
      upcoming: 0,
      followUpPending: 0,
      completed: 0,
      overdueFollowUps: 0,
      followUpsThisWeek: 0,
      upcomingVisitsThisWeek: 0,
    };

    for (const college of colleges) {
      if (college.status === 'Upcoming') stats.upcoming++;
      if (college.status === 'Follow-up Pending') stats.followUpPending++;
      if (college.status === 'Completed') stats.completed++;

      // Check follow-ups for overdue/this week
      for (const fu of college.followUps || []) {
        if (fu.isDone) continue;
        if (!fu.followUpDate) continue;
        const fuDate = new Date(fu.followUpDate);
        if (fuDate < today) stats.overdueFollowUps++;
        else if (fuDate <= sevenDaysLater) stats.followUpsThisWeek++;
      }

      if (college.status === 'Upcoming' && college.visitDate) {
        const visit = new Date(college.visitDate);
        if (visit >= today && visit <= sevenDaysLater) {
          stats.upcomingVisitsThisWeek++;
        }
      }
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/colleges/:id
const getCollegeById = async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, error: 'College not found' });
    }
    res.json({ success: true, data: college });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/colleges
const createCollege = async (req, res) => {
  try {
    const normalizedName = req.body.collegeName?.trim().toLowerCase();
    const existing = await College.findOne({ collegeNameNormalized: normalizedName });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `A college named "${existing.collegeName}" already exists`,
      });
    }

    req.body.lastUpdatedBy = req.employeeName;
    req.body.followUps = [];

    // Auto-compute status
    const tempCollege = { visitDate: req.body.visitDate, followUps: [] };
    req.body.status = computeStatus(tempCollege);

    const college = await College.create(req.body);
    res.status(201).json({ success: true, data: college });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// PUT /api/colleges/:id
const updateCollege = async (req, res) => {
  try {
    // Duplicate name check
    if (req.body.collegeName) {
      const normalizedName = req.body.collegeName.trim().toLowerCase();
      const existing = await College.findOne({
        collegeNameNormalized: normalizedName,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: `A college named "${existing.collegeName}" already exists`,
        });
      }
      req.body.collegeNameNormalized = normalizedName;
    }

    const currentCollege = await College.findById(req.params.id);
    if (!currentCollege) {
      return res.status(404).json({ success: false, error: 'College not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check visitDate overdue change
    if (req.body.visitDate && currentCollege.visitDate) {
      const current = new Date(currentCollege.visitDate);
      current.setHours(0, 0, 0, 0);
      const incoming = new Date(req.body.visitDate);
      incoming.setHours(0, 0, 0, 0);

      const isOverdue = current < today && currentCollege.status === 'Upcoming';
      const isChanging = current.getTime() !== incoming.getTime();
      const incomingIsBackdated = incoming < today;

      if (isChanging && (isOverdue || incomingIsBackdated)) {
        const { reason } = req.body;
        if (!reason || !reason.trim()) {
          return res.status(400).json({
            success: false,
            error: `A reason is required to ${isOverdue ? 'reschedule an overdue' : 'set a past'} visit date`,
            requiresReason: true,
            field: 'visitDate',
          });
        }
        await AuditLog.create({
          eventType: 'POSTPONE',
          collegeName: currentCollege.collegeName,
          collegeId: currentCollege._id,
          performedBy: req.employeeName,
          reason: reason.trim(),
          metadata: {
            field: 'visitDate',
            oldDate: currentCollege.visitDate,
            newDate: new Date(req.body.visitDate),
          },
        });
      }
    }
// Check follow-ups array for overdue date changes
if (req.body.followUps && Array.isArray(req.body.followUps)) {
  for (const incomingFU of req.body.followUps) {
    if (!incomingFU.followUpDate) continue;

    const incoming = new Date(incomingFU.followUpDate);
    incoming.setHours(0, 0, 0, 0);
    const incomingIsBackdated = incoming < today;

    // Find matching existing follow-up by _id
    const existingFU = incomingFU._id
      ? currentCollege.followUps.id(incomingFU._id)
      : null;

    let currentIsOverdue = false;
    let isChanging = true;

    if (existingFU && existingFU.followUpDate) {
      const current = new Date(existingFU.followUpDate);
      current.setHours(0, 0, 0, 0);
      currentIsOverdue = current < today && !existingFU.isDone;
      isChanging = current.getTime() !== incoming.getTime();
    }

    if (isChanging && (currentIsOverdue || incomingIsBackdated)) {
      const { reason } = req.body;
      if (!reason || !reason.trim()) {
        return res.status(400).json({
          success: false,
          error: `A reason is required to ${currentIsOverdue ? 'reschedule an overdue' : 'set a past'} follow-up date`,
          requiresReason: true,
          field: 'followUpDate',
        });
      }
      await AuditLog.create({
        eventType: 'POSTPONE',
        collegeName: currentCollege.collegeName,
        collegeId: currentCollege._id,
        performedBy: req.employeeName,
        reason: reason.trim(),
        metadata: {
          field: 'followUpDate',
          oldDate: existingFU?.followUpDate || null,
          newDate: incoming,
        },
      });
      break; // one reason covers the batch
    }
  }
}
// If user is explicitly setting Completed, respect it
// If user is explicitly setting Completed, require reason if visit is overdue
if (req.body.status === 'Completed') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (currentCollege.visitDate) {
    const visitDate = new Date(currentCollege.visitDate);
    visitDate.setHours(0, 0, 0, 0);
    const visitIsOverdue = visitDate < today && currentCollege.status === 'Upcoming';

    if (visitIsOverdue) {
      const { reason } = req.body;
      if (!reason || !reason.trim()) {
        return res.status(400).json({
          success: false,
          error: 'A reason is required to complete a college with an overdue visit date',
          requiresReason: true,
          field: 'visitDate',
        });
      }

      await AuditLog.create({
        eventType: 'POSTPONE',
        collegeName: currentCollege.collegeName,
        collegeId: currentCollege._id,
        performedBy: req.employeeName,
        reason: reason.trim(),
        metadata: {
          field: 'visitDate',
          oldDate: currentCollege.visitDate,
          newDate: currentCollege.visitDate, // date unchanged, just being closed out
        },
      });
    }
  }

  // Also check active follow-ups for overdue
  const activeFollowUps = (currentCollege.followUps || []).filter(f => !f.isDone && f.followUpDate);
  const hasOverdueFollowUp = activeFollowUps.some(f => {
    const d = new Date(f.followUpDate);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  });

  if (hasOverdueFollowUp) {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'A reason is required to complete a college with overdue follow-ups',
        requiresReason: true,
        field: 'followUpDate',
      });
    }

    await AuditLog.create({
      eventType: 'POSTPONE',
      collegeName: currentCollege.collegeName,
      collegeId: currentCollege._id,
      performedBy: req.employeeName,
      reason: reason.trim(),
      metadata: {
        field: 'followUpDate',
        oldDate: activeFollowUps[0].followUpDate,
        newDate: activeFollowUps[0].followUpDate,
      },
    });
  }

  delete req.body.reason;
  req.body.lastUpdatedBy = req.employeeName;

  const college = await College.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  return res.json({ success: true, data: college });
}
    // Auto-compute new status
    const updatedFollowUps = req.body.followUps !== undefined
      ? req.body.followUps
      : currentCollege.followUps;
    const updatedVisitDate = req.body.visitDate !== undefined
      ? req.body.visitDate
      : currentCollege.visitDate;

    req.body.status = computeStatus({
      visitDate: updatedVisitDate,
      followUps: updatedFollowUps,
    });

    delete req.body.reason;
    req.body.lastUpdatedBy = req.employeeName;

    const college = await College.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: college });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// DELETE /api/colleges/:id
const deleteCollege = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'A reason is required to delete a college',
      });
    }

    const college = await College.findByIdAndDelete(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, error: 'College not found' });
    }

    await AuditLog.create({
      eventType: 'DELETION',
      collegeName: college.collegeName,
      collegeId: college._id,
      performedBy: req.employeeName,
      reason: reason.trim(),
    });

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/colleges/:id/followup/:followUpId/done
const markFollowUpDone = async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, error: 'College not found' });
    }

    const followUp = college.followUps.id(req.params.followUpId);
    if (!followUp) {
      return res.status(404).json({ success: false, error: 'Follow-up not found' });
    }

    followUp.isDone = true;
    followUp.doneAt = new Date();

    // Recompute status
    college.status = computeStatus(college);
    college.lastUpdatedBy = req.employeeName;

    await college.save();
    res.json({ success: true, data: college });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getColleges,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
  getDashboardStats,
  markFollowUpDone,
};