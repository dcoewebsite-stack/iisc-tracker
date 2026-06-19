const multer = require('multer');

// Store file in memory, not on disk
// Disk storage is unnecessary for parsing-then-discarding a file
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true); // accept
  } else {
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false); // reject
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = upload;