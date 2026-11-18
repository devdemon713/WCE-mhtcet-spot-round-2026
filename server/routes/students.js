const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

// @route   GET /api/students
// @desc    Get all students (ADMIN)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { category, status, search, gender } = req.query;
    const filter = { role: 'student' };

    if (category) filter.category = category;
    if (status) filter.allocationStatus = status;
    if (gender) filter.gender = gender;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { applicationId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // .lean() + populate: returns plain JS objects (3-5x faster than full Mongoose documents)
    // Only select fields the UI actually needs. Only fetch 3 fields from Branch (not all).
    const students = await User.find(filter)
      .select('-password -branchPreferences -skippedInRounds')
      .populate('allocatedBranch', 'name type choiceCode')
      .sort({ wceMeritNumber: 1, mhtCetPercentile: -1 })
      .lean();

    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/students/stats
// @desc    Get student statistics (ADMIN)
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    // Single aggregation pass instead of 4 separate countDocuments calls
    const [statusAgg, categoryAgg] = await Promise.all([
      User.aggregate([
        { $match: { role: 'student' } },
        { $group: { _id: '$allocationStatus', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $match: { role: 'student' } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    const statusMap = {};
    let total = 0;
    for (const s of statusAgg) { statusMap[s._id] = s.count; total += s.count; }

    res.json({
      total,
      pending:   statusMap['pending']   || 0,
      allocated: statusMap['allocated'] || 0,
      confirmed: statusMap['confirmed'] || 0,
      cancelled: statusMap['cancelled'] || 0,
      categoryWise: categoryAgg
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/students/:id
// @desc    Get single student (ADMIN)
router.get('/:id', auth, adminOnly, async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .select('-password')
      .populate('allocatedBranch');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
