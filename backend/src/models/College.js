const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  followUpDate: {
    type: Date,
    default: null,
  },
  followUpNotes: {
    type: String,
    trim: true,
    default: '',
  },
  isDone: {
    type: Boolean,
    default: false,
  },
  doneAt: {
    type: Date,
    default: null,
  },
}, { _id: true });

const collegeSchema = new mongoose.Schema(
  {
    collegeName: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    collegeNameNormalized: {
      type: String,
      required: true,
      unique: true,
    },
    assignedEmployee: {
      type: String,
      trim: true,
      default: '',
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Follow-up Pending', 'Completed'],
      required: true,
      default: 'Upcoming',
    },
    visitDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    followUps: {
      type: [followUpSchema],
      default: [],
    },
    lastUpdatedBy: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

collegeSchema.pre('validate', function () {
  if (this.collegeName) {
    this.collegeNameNormalized = this.collegeName.trim().toLowerCase();
  }
});

module.exports = mongoose.model('College', collegeSchema);