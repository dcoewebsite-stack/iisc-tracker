const { computeStatus } = require('../utils/collegeStatus');
const XLSX = require('xlsx');
const College = require('../models/College');

const parseDate = (val) => {
  if (!val) return null;
  if (typeof val === 'number') {
    const date = new Date((val - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // "16-Mar-26" → "16 Mar 2026"
    const shortMonth = trimmed.replace(
      /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/,
      (_, d, m, y) => `${d} ${m} 20${y}`
    );

    // "17-04-2026" → "04/17/2026"
    const hyphenDate = trimmed.replace(
      /^(\d{1,2})-(\d{2})-(\d{4})$/,
      (_, d, m, y) => `${m}/${d}/${y}`
    );

    for (const attempt of [shortMonth, hyphenDate, trimmed]) {
      const d = new Date(attempt);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }
  return null;
};

const importColleges = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Excel file is empty' });
    }

    const collegeGroups = [];
    let currentGroup = null;

    for (const row of rows) {
      const hasIndex = row['Index'] !== '' &&
                       row['Index'] !== undefined &&
                       String(row['Index']).trim() !== '';
      const collegeName = row['College Name']?.toString().trim();

      if (hasIndex && collegeName) {
        if (currentGroup) collegeGroups.push(currentGroup);
        currentGroup = { primaryRow: row, continuationRows: [] };
      } else if (currentGroup) {
        currentGroup.continuationRows.push(row);
      }
    }
    if (currentGroup) collegeGroups.push(currentGroup);

    const results = { imported: 0, skipped: 0, errors: [] };

    for (const group of collegeGroups) {
      const row = group.primaryRow;
      const allRows = [row, ...group.continuationRows];

      const collegeName = row['College Name']?.toString().trim();
      const visitDate = parseDate(row['Visit Date']);
      const assignedEmployee = row['Assigned Employee']?.toString().trim() || '';
      const contactPerson = row['Contact Person ']?.toString().trim() || '';
      const notes = row['Notes']?.toString().trim() || '';

      if (!collegeName) {
        results.skipped++;
        results.errors.push(`Skipped: missing college name`);
        continue;
      }

      if (!visitDate) {
        results.skipped++;
        results.errors.push(`Skipped "${collegeName}": no valid visit date`);
        continue;
      }

      const normalizedName = collegeName.toLowerCase();
      const existing = await College.findOne({ collegeNameNormalized: normalizedName });
      if (existing) {
        results.skipped++;
        results.errors.push(`Skipped "${collegeName}": already exists`);
        continue;
      }

      // Build follow-ups from ALL rows in the group
      // parseDate handles both "24-03-26" and "24-03-2026" formats
      const followUps = [];

      for (const r of allRows) {
        const fu1Date = parseDate(r['Follow up Date ']);
        const fu1Notes = r['Follow Up Notes']?.toString().trim() || '';
        if (fu1Date) followUps.push({
          followUpDate: fu1Date,
          followUpNotes: fu1Notes,
          isDone: false,
          doneAt: null,
        });

        const fu2Date = parseDate(r['Follow Up Date ']);
        const fu2Notes = r['Follow Up Notes_1']?.toString().trim() || '';
        if (fu2Date) followUps.push({
          followUpDate: fu2Date,
          followUpNotes: fu2Notes,
          isDone: false,
          doneAt: null,
        });

        const fu3Date = parseDate(r['Follow up Date _1']);
        const fu3Notes = r['Follow Up Notes_2']?.toString().trim() || '';
        if (fu3Date) followUps.push({
          followUpDate: fu3Date,
          followUpNotes: fu3Notes,
          isDone: false,
          doneAt: null,
        });

        const fu4Date = parseDate(r['Follow up Date _2']);
        if (fu4Date) followUps.push({
          followUpDate: fu4Date,
          followUpNotes: '',
          isDone: false,
          doneAt: null,
        });
      }

      // Deduplicate follow-ups by date string
      const seen = new Set();
      const uniqueFollowUps = followUps.filter(fu => {
        const key = fu.followUpDate?.toString();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      await College.create({
        collegeName,
        assignedEmployee,
        contactPerson,
        status: computeStatus({ visitDate, followUps: uniqueFollowUps }),
        visitDate,
        notes,
        followUps: uniqueFollowUps,
        lastUpdatedBy: req.employeeName,
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