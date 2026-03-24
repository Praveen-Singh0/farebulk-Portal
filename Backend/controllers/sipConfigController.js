const { SipConfig } = require('../models/SipConfig');
const { User } = require('../models/User');

// Get SIP config for the logged-in user
const getMySipConfig = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email userName');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Look up by email (primary) or userName (fallback)
    let config = await SipConfig.findOne({ userName: user.email, isActive: true });
    if (!config) {
      config = await SipConfig.findOne({ userName: user.userName, isActive: true });
    }
    if (!config) return res.status(404).json({ message: 'No SIP config found for your account' });

    res.json({
      sipExtension: config.sipExtension,
      sipPassword: config.sipPassword,
      sipDomain: config.sipDomain,
      wssServer: config.wssServer,
      displayName: config.displayName || user.userName || user.email,
    });
  } catch (error) {
    console.error('Error fetching SIP config:', error);
    res.status(500).json({ message: 'Failed to fetch SIP config' });
  }
};

// Admin: get all SIP configs
const getAllSipConfigs = async (req, res) => {
  try {
    const configs = await SipConfig.find().sort({ userName: 1 });
    res.json(configs);
  } catch (error) {
    console.error('Error fetching SIP configs:', error);
    res.status(500).json({ message: 'Failed to fetch SIP configs' });
  }
};

// Admin: create or update SIP config for a user
const upsertSipConfig = async (req, res) => {
  try {
    const { userName, sipExtension, sipPassword, sipDomain, wssServer, displayName, isActive } = req.body;

    if (!userName || !sipExtension || !sipPassword || !sipDomain || !wssServer) {
      return res.status(400).json({ message: 'All fields are required: userName, sipExtension, sipPassword, sipDomain, wssServer' });
    }

    const config = await SipConfig.findOneAndUpdate(
      { userName },
      { sipExtension, sipPassword, sipDomain, wssServer, displayName: displayName || '', isActive: isActive !== false },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ message: 'SIP config saved', data: config });
  } catch (error) {
    console.error('Error saving SIP config:', error);
    res.status(500).json({ message: 'Failed to save SIP config' });
  }
};

// Admin: delete SIP config
const deleteSipConfig = async (req, res) => {
  try {
    const { id } = req.params;
    await SipConfig.findByIdAndDelete(id);
    res.json({ message: 'SIP config deleted' });
  } catch (error) {
    console.error('Error deleting SIP config:', error);
    res.status(500).json({ message: 'Failed to delete SIP config' });
  }
};

// Get global SIP defaults (for admin settings page)
const getGlobalDefaults = async (req, res) => {
  try {
    const config = await SipConfig.findOne().sort({ updatedAt: -1 });
    res.json({
      sipDomain: config?.sipDomain || '',
      wssServer: config?.wssServer || '',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch defaults' });
  }
};

module.exports = {
  getMySipConfig,
  getAllSipConfigs,
  upsertSipConfig,
  deleteSipConfig,
  getGlobalDefaults,
};
