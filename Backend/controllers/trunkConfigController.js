// controllers/trunkConfigController.js
const fs = require('fs');
const { User } = require('../models/User');
const TrunkConfig = require('../models/TrunkConfig');
const { exec } = require('child_process');
const path = require('path');

const PJSIP_CONF = '/etc/asterisk/pjsip.conf';

// Helper: read pjsip.conf and extract trunk username & password
const readTrunkConfig = () => {
  const content = fs.readFileSync(PJSIP_CONF, 'utf-8');

  // Extract username from [therealpbx-auth] section
  const authMatch = content.match(/\[therealpbx-auth\][\s\S]*?username=(\S+)/);
  const passMatch = content.match(/\[therealpbx-auth\][\s\S]*?password=(\S+)/);

  return {
    username: authMatch ? authMatch[1] : '',
    password: passMatch ? passMatch[1] : '',
  };
};

// Helper: update pjsip.conf with new username & password
const writeTrunkConfig = (username, password) => {
  let content = fs.readFileSync(PJSIP_CONF, 'utf-8');
  const oldConfig = readTrunkConfig();
  const oldUsername = oldConfig.username;

  // 1) Update [therealpbx-auth] username
  content = content.replace(
    /(\[therealpbx-auth\][\s\S]*?username=)\S+/,
    `$1${username}`
  );

  // 2) Update [therealpbx-auth] password
  content = content.replace(
    /(\[therealpbx-auth\][\s\S]*?password=)\S+/,
    `$1${password}`
  );

  // 3) Update [therealpbx] from_user
  content = content.replace(
    /(\[therealpbx\][\s\S]*?from_user=)\S+/,
    `$1${username}`
  );

  // 4) Update [therealpbx] callerid
  content = content.replace(
    /(\[therealpbx\][\s\S]*?callerid="Farebulk"\s*<)\S+?(>)/,
    `$1${username}$2`
  );

  // 5) Update [therealpbx-aor] contact URI (replace old username in sip:USER@...)
  content = content.replace(
    /(\[therealpbx-aor\][\s\S]*?contact=sip:)\S+?(@)/,
    `$1${username}$2`
  );

  // 6) Update [therealpbx-registration] client_uri (sip:USER@...)
  content = content.replace(
    /(\[therealpbx-registration\][\s\S]*?client_uri=sip:)\S+?(@)/,
    `$1${username}$2`
  );

  // Write the file
  fs.writeFileSync(PJSIP_CONF, content, 'utf-8');
};

// Helper: reload Asterisk PJSIP module
const reloadAsterisk = () => {
  return new Promise((resolve, reject) => {
    exec('asterisk -rx "module reload res_pjsip.so"', (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve(stdout.trim());
    });
  });
};

// Helper: check trunk registration status
const getTrunkStatus = () => {
  return new Promise((resolve, reject) => {
    exec('asterisk -rx "pjsip show registrations"', (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve(stdout.trim());
    });
  });
};

// GET /api/trunk/config — read current trunk config
exports.getTrunkConfig = async (req, res) => {
  try {
    // Admin only
    const dbUser = await User.findById(req.user.id).select('role');
    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const config = readTrunkConfig();

    // Get agent info from database
    let agentName = '';
    let agentPhone = '';
    try {
      const trunkConfig = await TrunkConfig.findOne().select('agentName agentPhone');
      if (trunkConfig) {
        agentName = trunkConfig.agentName || '';
        agentPhone = trunkConfig.agentPhone || '';
      }
    } catch (err) {
      console.warn('Could not fetch trunk config from DB:', err.message);
    }

    // Get registration status
    let registrationStatus = 'Unknown';
    try {
      const statusOutput = await getTrunkStatus();
      console.log('Registration status output:', statusOutput);
      // Check for "Registered" first (more specific)
      if (statusOutput.includes('Registered') && !statusOutput.includes('Unregistered')) {
        registrationStatus = 'Registered';
      } else if (statusOutput.includes('Rejected')) {
        registrationStatus = 'Rejected';
      } else if (statusOutput.includes('Unregistered')) {
        registrationStatus = 'Unregistered';
      } else {
        registrationStatus = 'Unknown';
      }
    } catch (err) {
      console.error('Error checking status:', err);
      registrationStatus = 'Error checking status';
    }

    res.json({
      agentName,
      agentPhone,
      username: config.username,
      password: config.password,
      registrationStatus,
    });
  } catch (err) {
    console.error('Error reading trunk config:', err);
    res.status(500).json({ message: 'Failed to read trunk configuration' });
  }
};

// PUT /api/trunk/config — update trunk config
exports.updateTrunkConfig = async (req, res) => {
  try {
    // Admin only
    const dbUser = await User.findById(req.user.id).select('role');
    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { agentName, agentPhone, username, password } = req.body;

    if (!agentName || !agentPhone || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Save agent info to database
    try {
      let trunkConfig = await TrunkConfig.findOne();
      if (!trunkConfig) {
        trunkConfig = new TrunkConfig();
      }
      trunkConfig.agentName = agentName.trim();
      trunkConfig.agentPhone = agentPhone.trim();
      await trunkConfig.save();
    } catch (err) {
      console.error('Error saving trunk config to DB:', err);
      return res.status(500).json({ message: 'Failed to save agent information' });
    }

    // Backup current config
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${PJSIP_CONF}.backup-${timestamp}`;
    fs.copyFileSync(PJSIP_CONF, backupPath);

    // Update the config
    writeTrunkConfig(username.trim(), password.trim());

    // Reload Asterisk
    let reloadResult = '';
    try {
      reloadResult = await reloadAsterisk();
    } catch (err) {
      console.error('Asterisk reload error:', err);
      return res.status(500).json({
        message: 'Agent info saved but Asterisk reload failed. Check server logs.',
        backupPath,
      });
    }

    // Wait a moment for registration to attempt
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check registration status
    let registrationStatus = 'Unknown';
    try {
      const statusOutput = await getTrunkStatus();
      console.log('Registration status output after reload:', statusOutput);
      // Check for "Registered" first (more specific)
      if (statusOutput.includes('Registered') && !statusOutput.includes('Unregistered')) {
        registrationStatus = 'Registered';
      } else if (statusOutput.includes('Rejected')) {
        registrationStatus = 'Rejected';
      } else if (statusOutput.includes('Unregistered')) {
        registrationStatus = 'Unregistered';
      } else {
        registrationStatus = 'Unknown';
      }
    } catch (err) {
      console.error('Error checking status:', err);
      registrationStatus = 'Check manually';
    }

    res.json({
      message: 'Trunk configuration updated and Asterisk reloaded',
      registrationStatus,
      backupPath,
    });
  } catch (err) {
    console.error('Error updating trunk config:', err);
    res.status(500).json({ message: 'Failed to update trunk configuration' });
  }
};
