const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/upload');
const { importColleges } = require('../controllers/importController');

router.post('/', protect, upload.single('file'), importColleges);

module.exports = router;