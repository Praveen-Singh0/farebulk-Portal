const AuthRecord = require('../models/AuthRecord');
const { User } = require('../models/User');
const path = require('path');
const fs = require('fs');

// Helper: get user from JWT token (token only has { id })
const getUserFromToken = async (req) => {
  const userId = req.user.id;
  const user = await User.findById(userId).select('email role userName');
  return user;
};

// GET all auth records (admin sees all, agents see their own)
const getAuthRecords = async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let query = {};
    
    // Non-admin users only see their own records
    if (user.role !== 'admin' && user.role !== 'ticket') {
      query.agentName = user.userName;
    }
    
    const records = await AuthRecord.find(query)
      .sort({ sentAt: -1 })
      .limit(200);
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching auth records:', error);
    res.status(500).json({ message: 'Failed to fetch auth records' });
  }
};

// GET single auth record
const getAuthRecord = async (req, res) => {
  try {
    const record = await AuthRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Auth record not found' });
    }
    res.json(record);
  } catch (error) {
    console.error('Error fetching auth record:', error);
    res.status(500).json({ message: 'Failed to fetch auth record' });
  }
};

// GET auth stats for dashboard
const getAuthStats = async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let matchQuery = {};
    
    if (user.role !== 'admin' && user.role !== 'ticket') {
      matchQuery.agentName = user.userName;
    }
    
    const totalSent = await AuthRecord.countDocuments({ ...matchQuery, status: 'sent' });
    const totalAuthorized = await AuthRecord.countDocuments({ ...matchQuery, status: 'authorized' });
    const totalExpired = await AuthRecord.countDocuments({ ...matchQuery, status: 'expired' });
    
    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySent = await AuthRecord.countDocuments({ 
      ...matchQuery, 
      sentAt: { $gte: today } 
    });
    const todayAuthorized = await AuthRecord.countDocuments({ 
      ...matchQuery, 
      status: 'authorized',
      authorizedAt: { $gte: today } 
    });
    
    res.json({
      totalSent,
      totalAuthorized,
      totalExpired,
      todaySent,
      todayAuthorized,
      total: totalSent + totalAuthorized + totalExpired
    });
  } catch (error) {
    console.error('Error fetching auth stats:', error);
    res.status(500).json({ message: 'Failed to fetch auth stats' });
  }
};

// Download PDF
const downloadPdf = async (req, res) => {
  try {
    const record = await AuthRecord.findById(req.params.id);
    if (!record || !record.pdfPath) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    
    const filePath = record.pdfPath;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'PDF file not found on server' });
    }
    
    res.download(filePath, `authorization_${record.cardholderName}_${record.cardLast4}.pdf`);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ message: 'Failed to download PDF' });
  }
};

// POST - create auth record (called from Auth Form backend)
const createAuthRecord = async (req, res) => {
  try {
    const record = new AuthRecord(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating auth record:', error);
    res.status(500).json({ message: 'Failed to create auth record' });
  }
};

// PUT - update auth record status (called from Auth Form backend)
const updateAuthRecord = async (req, res) => {
  try {
    const { token } = req.params;
    const updateData = req.body;
    
    const record = await AuthRecord.findOneAndUpdate(
      { token },
      { $set: updateData },
      { new: true }
    );
    
    if (!record) {
      return res.status(404).json({ message: 'Auth record not found' });
    }
    
    res.json(record);
  } catch (error) {
    console.error('Error updating auth record:', error);
    res.status(500).json({ message: 'Failed to update auth record' });
  }
};

module.exports = {
  getAuthRecords,
  getAuthRecord,
  getAuthStats,
  downloadPdf,
  createAuthRecord,
  updateAuthRecord
};
