const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getColleges,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
  getDashboardStats,
  markFollowUpDone,
} = require('../controllers/collegeController');

router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/', getColleges);
router.get('/:id', getCollegeById);
router.post('/', createCollege);
router.put('/:id', updateCollege);
router.delete('/:id', deleteCollege);
router.put('/:id/followup/:followUpId/done', markFollowUpDone);

module.exports = router;