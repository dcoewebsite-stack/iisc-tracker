const XLSX = require('xlsx');
const College = require('../models/College');

const importColleges = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Parse the Excel buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // always use the first sheet
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Excel file is empty' });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    for (const row of rows) {
      // Normalize expected column names (trim + handle case variations)
      const collegeName = row['College Name']?.toString().trim();
      const assignedEmployee = row['Assigned Employee']?.toString().trim();
      const status = row['Status']?.toString().trim() || 'Upcoming';
      const visitDate = row['Visit Date'] ? new Date(row['Visit Date']) : null;
      const notes = row['Notes']?.toString().trim() || '';
      const followUpDate = row['Follow Up Date'] ? new Date(row['Follow Up Date']) : null;
      const followUpNotes = row['Follow Up Notes']?.toString().trim() || '';

      // Validate required fields
      if (!collegeName || !assignedEmployee) {
        results.skipped++;
        results.errors.push(`Skipped row: missing College Name or Assigned Employee`);
        continue;
      }

      // Validate status enum
      if (!['Upcoming', 'Visited'].includes(status)) {
        results.skipped++;
        results.errors.push(`Skipped "${collegeName}": invalid status "${status}"`);
        continue;
      }

      // Check for duplicate
      const normalizedName = collegeName.toLowerCase();
      const existing = await College.findOne({ collegeNameNormalized: normalizedName });
      if (existing) {
        results.skipped++;
        results.errors.push(`Skipped "${collegeName}": already exists`);
        continue;
      }

      // Insert
      await College.create({
        collegeName,
        assignedEmployee,
        status,
        visitDate,
        notes,
        followUpDate,
        followUpNotes,
        lastUpdatedBy: req.employeeName, // from JWT middleware
      });

      results.imported++;
    }

    res.json({
      success: true,
      message: `Import complete: ${results.imported} imported, ${results.skipped} skipped`,
      data: results,
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { importColleges };