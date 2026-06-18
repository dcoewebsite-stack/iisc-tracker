const College = require('../models/College');

// GET /api/colleges
const getColleges = async (req, res) => {
  try {
    const colleges = await College.find();
    res.json({ success: true, data: colleges });
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

    const college = await College.create(req.body);
    res.status(201).json({ success: true, data: college });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// PUT /api/colleges/:id
const updateCollege = async (req, res) => {
  try {
    if (req.body.collegeName) {
      const normalizedName = req.body.collegeName.trim().toLowerCase();

      const existing = await College.findOne({
        collegeNameNormalized: normalizedName,
        _id: { $ne: req.params.id }, // exclude the current document itself
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: `A college named "${existing.collegeName}" already exists`,
        });
      }

      req.body.collegeNameNormalized = normalizedName;
    }

    const college = await College.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!college) {
      return res.status(404).json({ success: false, error: 'College not found' });
    }
    res.json({ success: true, data: college });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// DELETE /api/colleges/:id
const deleteCollege = async (req, res) => {
  try {
    const college = await College.findByIdAndDelete(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, error: 'College not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getColleges,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
};