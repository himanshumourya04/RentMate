const mongoose = require('mongoose');

const approvedManagementSchema = new mongoose.Schema({
  managementId: {
    type: String,
    required: true,
    unique: true,
  },
  managementName: {
    type: String,
    required: true,
  },
  managementEmail: {
    type: String,
    required: true,
    lowercase: true,
  },
  branch: {
    type: String,
    enum: ['CSE', 'Mechanical', 'Electrical', 'Civil', 'IT'],
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('ApprovedManagement', approvedManagementSchema);
