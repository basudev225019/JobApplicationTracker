const mongoose = require('mongoose');

const historyschema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedat: { type: Date, default: Date.now },
  },
  { _id: false }
);

const applicationschema = new mongoose.Schema(
  {
    appid: { type: String, unique: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    jobtype: {
      type: String,
      enum: ['Full-time', 'Internship', 'Contract'],
      required: true,
    },
    applieddate: { type: Date, required: true },
    salary: { type: Number },
    notes: { type: String },
    status: {
      type: String,
      enum: ['Applied', 'Interview', 'Offer', 'Rejected', 'Accepted', 'Declined'],
      default: 'Applied',
    },
    statushistory: [historyschema],
    followupdate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationschema);
