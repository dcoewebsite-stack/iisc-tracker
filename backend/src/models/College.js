const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema(
  {
    collegeName: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    assignedEmployee: {
      type: String,
      required: [true, 'Assigned employee is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Visited'],
      required: [true, 'Status is required'],
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
    followUpDate: {
      type: Date,
      default: null,
    },
    followUpNotes: {
      type: String,
      trim: true,
      default: '',
    },
    lastUpdatedBy: {
      type: String,
      trim: true,
      default: '',
    },
    collegeNameNormalized: {
      type: String,
      required: true,
      unique: true, 
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);
collegeSchema.pre('validate', function () {
  if (this.collegeName) {
    this.collegeNameNormalized = this.collegeName.trim().toLowerCase();
  }
});

module.exports = mongoose.model('College', collegeSchema);