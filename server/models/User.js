const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

  // ── Auth fields ─────────────────────────────────────────────────────────────
  applicationId: {
    type: String,
    required: [true, 'MHT-CET Application ID is required'],
    trim: true
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  // Photo — stored as a URL (e.g. base64 data URL or external URL)
  photo: {
    type: String,
    default: null
  },

  // ── MHT-CET Merit List Fields (from Excel) ──────────────────────────────────
  wceMeritNumber:    { type: Number, default: null },
  stateMeritNumber:  { type: Number, default: null },

  category: {
    type: String,
    enum: ['OPEN', 'SC', 'ST', 'VJ_DT', 'NTB', 'NTC', 'NTD', 'OBC', 'SEBC', 'EWS'],
    required: [true, 'Category is required'],
    default: 'OPEN'
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: [true, 'Gender is required']
  },

  // PH Type — replaces the old isPWD boolean
  phType: {
    type: String,
    enum: ['Not Applicable', 'VH', 'HH', 'OH', 'ASD', 'MR', 'SLD', 'MI', 'MD'],
    default: 'Not Applicable'
  },

  // Defence Type — replaces the old isDEF boolean
  defenceType: {
    type: String,
    enum: [
      'Not Applicable',
      'Ward of Ex-Serviceman',
      'Ward of Serving Def Personnel',
      'Ward of Serving Paramilitary'
    ],
    default: 'Not Applicable'
  },

  isOrphan: { type: Boolean, default: false },

  // MHT-CET Percentiles
  mhtCetPercentile:  { type: Number, default: 0 }, // Total Percentile
  mathPercentile:    { type: Number, default: 0 },
  physicsPercentile: { type: Number, default: 0 },
  chemistryPercentile: { type: Number, default: 0 },

  // HSC / Class XII
  hscPercentage: { type: Number, default: 0 },

  // ── Student Type ─────────────────────────────────────────────────────────────
  studentType: {
    type: String,
    enum: ['CAP', 'Non-CAP'],
    default: 'CAP'
  },

  // ── Role & Allocation (admin-controlled) ─────────────────────────────────────
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  allocationStatus: {
    type: String,
    enum: ['pending', 'allocated', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  allocatedBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null
  },
  allocatedSeatCategory: { type: String, default: null },
  allocatedSeatType:     { type: String, default: null },


}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
