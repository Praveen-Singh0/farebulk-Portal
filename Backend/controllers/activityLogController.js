const { ActivityLog } = require('../models/ActivityLog');
const { User } = require('../models/User');

// Log an activity event
const logActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('email role userName');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { action } = req.body;
    if (!['login', 'break', 'back', 'logout'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be: login, break, back, logout' });
    }

    const log = new ActivityLog({
      userName: user.userName,
      email: user.email,
      role: user.role,
      action,
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '',
    });
    await log.save();

    res.status(201).json({ message: `Activity '${action}' logged`, data: log });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ message: 'Failed to log activity' });
  }
};

// Get current status of all users (for admin dashboard)
const getUserStatuses = async (req, res) => {
  try {
    // Get all users
    const users = await User.find().select('email role userName');

    // For each user, get their latest activity
    const statuses = await Promise.all(
      users.map(async (u) => {
        const latestActivity = await ActivityLog.findOne({ userName: u.userName })
          .sort({ timestamp: -1 })
          .limit(1);

        return {
          userName: u.userName,
          email: u.email,
          role: u.role,
          currentStatus: latestActivity ? latestActivity.action : 'offline',
          lastActivity: latestActivity ? latestActivity.timestamp : null,
        };
      })
    );

    res.json(statuses);
  } catch (error) {
    console.error('Error fetching user statuses:', error);
    res.status(500).json({ message: 'Failed to fetch user statuses' });
  }
};

// Get activity logs with filters (admin)
const getActivityLogs = async (req, res) => {
  try {
    const { userName, action, date, fromDate, toDate, limit = 500 } = req.query;
    const filter = {};

    if (userName) filter.userName = userName;
    if (action) filter.action = action;

    if (date) {
      const d = new Date(date);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.timestamp = { $gte: d, $lt: nextDay };
    } else if (fromDate || toDate) {
      filter.timestamp = {};
      if (fromDate) filter.timestamp.$gte = new Date(fromDate);
      if (toDate) {
        const to = new Date(toDate);
        to.setDate(to.getDate() + 1);
        filter.timestamp.$lt = to;
      }
    }

    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
};

// Get today's timeline for a specific user
const getUserTimeline = async (req, res) => {
  try {
    const { userName } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await ActivityLog.find({
      userName,
      timestamp: { $gte: today, $lt: tomorrow },
    }).sort({ timestamp: 1 });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching user timeline:', error);
    res.status(500).json({ message: 'Failed to fetch user timeline' });
  }
};

module.exports = {
  logActivity,
  getUserStatuses,
  getActivityLogs,
  getUserTimeline,
};
