// controllers/callDashboardController.js
const AsteriskManager = require('asterisk-manager');
const { User } = require('../models/User');

const AMI_HOST = '127.0.0.1';
const AMI_PORT = 5038;
const AMI_USER = 'crmadmin';
const AMI_PASS = 'FarebulkCRM2025!';

// Helper: create a short-lived AMI connection, run action, close
function amiAction(action) {
  return new Promise((resolve, reject) => {
    const ami = new AsteriskManager(AMI_PORT, AMI_HOST, AMI_USER, AMI_PASS, true);
    let timeout = setTimeout(() => {
      ami.disconnect();
      reject(new Error('AMI connection timeout'));
    }, 8000);

    ami.on('error', (err) => {
      clearTimeout(timeout);
      ami.disconnect();
      reject(err);
    });

    ami.on('connect', () => {
      ami.action(action, (err, res) => {
        clearTimeout(timeout);
        if (err) {
          ami.disconnect();
          return reject(err);
        }
        resolve(res);
        ami.disconnect();
      });
    });
  });
}

// Helper: run an Asterisk CLI command via AMI
function amiCommand(command) {
  return new Promise((resolve, reject) => {
    const ami = new AsteriskManager(AMI_PORT, AMI_HOST, AMI_USER, AMI_PASS, true);
    let timeout = setTimeout(() => {
      ami.disconnect();
      reject(new Error('AMI connection timeout'));
    }, 8000);

    ami.on('error', (err) => {
      clearTimeout(timeout);
      ami.disconnect();
      reject(err);
    });

    ami.on('connect', () => {
      ami.action({
        action: 'Command',
        command: command
      }, (err, res) => {
        clearTimeout(timeout);
        if (err) {
          ami.disconnect();
          return reject(err);
        }
        resolve(res);
        ami.disconnect();
      });
    });
  });
}

// Extract raw text from AMI response
function getRaw(result) {
  if (typeof result === 'string') return result;
  if (result && result.output) return result.output;
  if (result && result.content) return result.content;
  if (result && typeof result === 'object') {
    // Some AMI responses put data in numbered keys
    const lines = [];
    for (const key of Object.keys(result)) {
      if (/^\d+$/.test(key) || key === 'output' || key === 'content') continue;
      if (typeof result[key] === 'string') lines.push(result[key]);
    }
    if (lines.length) return lines.join('\n');
    return JSON.stringify(result);
  }
  return '';
}

// Helper: parse "core show channels concise" output into structured calls
function parseChannels(output) {
  if (!output) return [];
  const raw = getRaw(output);
  const lines = raw.split('\n').filter(l => l.trim() && !l.includes('active call') && !l.includes('active channel'));

  const channels = [];
  for (const line of lines) {
    const parts = line.split('!');
    if (parts.length >= 12) {
      channels.push({
        channel: parts[0] || '',
        context: parts[1] || '',
        extension: parts[2] || '',
        priority: parts[3] || '',
        state: parts[4] || '',
        application: parts[5] || '',
        data: parts[6] || '',
        callerID: parts[7] || '',
        accountCode: parts[8] || '',
        peerAccount: parts[9] || '',
        amaFlags: parts[10] || '',
        duration: parts[11] || '',
        bridgeID: parts[12] || '',
        uniqueID: parts[13] || '',
        linkedID: parts[14] || '',
      });
    }
  }
  return channels;
}

// Group channels into call pairs by bridgeID / linkedID
function groupIntoCalls(channels) {
  const calls = [];
  const used = new Set();

  for (const ch of channels) {
    if (used.has(ch.uniqueID)) continue;

    let partner = null;
    if (ch.bridgeID) {
      partner = channels.find(c => c.bridgeID === ch.bridgeID && c.uniqueID !== ch.uniqueID && !used.has(c.uniqueID));
    }
    if (!partner && ch.linkedID) {
      partner = channels.find(c => c.linkedID === ch.linkedID && c.uniqueID !== ch.uniqueID && !used.has(c.uniqueID));
    }

    used.add(ch.uniqueID);
    if (partner) used.add(partner.uniqueID);

    const callee = partner;
    // Match PJSIP/XXX or Local/XXX@internal formats
    const extMatch = ch.channel.match(/(?:PJSIP|Local)\/(\d+)/);
    const ext = extMatch ? extMatch[1] : '';
    const partnerExtMatch = partner ? partner.channel.match(/(?:PJSIP|Local)\/(\d+)/) : null;
    const partnerExt = partnerExtMatch ? partnerExtMatch[1] : '';
    const duration = parseInt(ch.duration) || 0;

    let direction = 'internal';
    if (ch.context === 'from-trunk' || (partner && partner.context === 'from-trunk')) {
      direction = 'inbound';
    } else if (ch.application === 'Dial' && ch.data && ch.data.includes('therealpbx')) {
      direction = 'outbound';
    } else if (partner && partner.channel && partner.channel.includes('therealpbx')) {
      direction = 'outbound';
    }

    calls.push({
      id: ch.uniqueID,
      channel: ch.channel,
      callerChannel: ch.channel,
      calleeChannel: partner ? partner.channel : '',
      extension: ext || partnerExt,
      callerID: ch.callerID || '',
      calleeNumber: callee ? (callee.extension || callee.callerID) : ch.extension,
      state: ch.state,
      application: ch.application,
      duration: duration,
      durationFormatted: formatDuration(duration),
      direction,
      bridgeID: ch.bridgeID || '',
      linkedID: ch.linkedID || '',
    });
  }

  return calls;
}

function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Admin check helper
async function checkAdmin(req) {
  const dbUser = await User.findById(req.user.id).select('role');
  return dbUser && dbUser.role === 'admin';
}

// ========== ENDPOINTS ==========

// GET /api/ami/live-calls
exports.getLiveCalls = async (req, res) => {
  try {
    if (!(await checkAdmin(req))) return res.status(403).json({ message: 'Admin access required' });

    const result = await amiCommand('core show channels concise');
    const channels = parseChannels(result);
    const calls = groupIntoCalls(channels);

    let activeCount = 0;
    let activeCallCount = 0;
    try {
      const countResult = await amiCommand('core show channels count');
      const countRaw = getRaw(countResult);
      const chMatch = countRaw.match(/(\d+)\s+active channel/);
      const callMatch = countRaw.match(/(\d+)\s+active call/);
      if (chMatch) activeCount = parseInt(chMatch[1]);
      if (callMatch) activeCallCount = parseInt(callMatch[1]);
    } catch (e) {}

    res.json({
      calls,
      activeChannels: activeCount,
      activeCalls: activeCallCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error getting live calls:', err);
    res.status(500).json({ message: 'Failed to get live calls', error: err.message });
  }
};

// GET /api/ami/ring-strategy
exports.getRingStrategy = async (req, res) => {
  try {
    if (!(await checkAdmin(req))) return res.status(403).json({ message: 'Admin access required' });

    const result = await amiCommand('dialplan show globals');
    const raw = getRaw(result);

    let strategy = 'ringall';
    const stratMatch = raw.match(/RING_STRATEGY.*?=\s*'?(\w+)'?/i);
    if (stratMatch) strategy = stratMatch[1];

    let extensions = '101,102,103,104,105,106,107,108,109,110';
    const extMatch = raw.match(/RING_EXTENSIONS.*?=\s*'?([^'\n]+)'?/i);
    if (extMatch) extensions = extMatch[1].trim();

    res.json({ strategy, extensions });
  } catch (err) {
    console.error('Error getting ring strategy:', err);
    res.status(500).json({ message: 'Failed to get ring strategy' });
  }
};

// PUT /api/ami/ring-strategy
exports.updateRingStrategy = async (req, res) => {
  try {
    if (!(await checkAdmin(req))) return res.status(403).json({ message: 'Admin access required' });

    const { strategy } = req.body;
    const validStrategies = ['ringall', 'roundrobin', 'random', 'leastrecent'];
    if (!strategy || !validStrategies.includes(strategy)) {
      return res.status(400).json({ message: `Invalid strategy. Must be one of: ${validStrategies.join(', ')}` });
    }

    await amiCommand(`dialplan set global RING_STRATEGY ${strategy}`);

    const fs = require('fs');
    const confPath = '/etc/asterisk/extensions.conf';
    let content = fs.readFileSync(confPath, 'utf-8');
    content = content.replace(/RING_STRATEGY=\w+/, `RING_STRATEGY=${strategy}`);
    fs.writeFileSync(confPath, content, 'utf-8');

    // Also update queue strategy
    const queueStrategyMap = {
      'ringall': 'ringall',
      'roundrobin': 'rrmemory',
      'random': 'random',
      'leastrecent': 'leastrecent'
    };
    try {
      const qStrat = queueStrategyMap[strategy] || 'ringall';
      const qConf = '/etc/asterisk/queues.conf';
      let qContent = fs.readFileSync(qConf, 'utf-8');
      qContent = qContent.replace(/strategy\s*=\s*\w+/, `strategy = ${qStrat}`);
      fs.writeFileSync(qConf, qContent, 'utf-8');
      await amiCommand('module reload app_queue.so');
    } catch (e) {
      console.error('Queue strategy update error:', e);
    }

    res.json({ message: `Ring strategy updated to ${strategy}`, strategy });
  } catch (err) {
    console.error('Error updating ring strategy:', err);
    res.status(500).json({ message: 'Failed to update ring strategy' });
  }
};

// POST /api/ami/barge
exports.bargeCall = async (req, res) => {
  try {
    if (!(await checkAdmin(req))) return res.status(403).json({ message: 'Admin access required' });

    const { extension, adminExtension } = req.body;
    if (!extension || !adminExtension) {
      return res.status(400).json({ message: 'extension and adminExtension are required' });
    }

    const result = await amiAction({
      action: 'Originate',
      channel: `PJSIP/${adminExtension}`,
      context: 'internal',
      exten: `555${extension}`,
      priority: 1,
      callerid: `"Barge ${extension}" <555${extension}>`,
      timeout: 30000,
      async: 'true',
    });

    res.json({
      message: `Barge initiated — your phone (ext ${adminExtension}) will ring. Answer to join the call on ext ${extension}.`,
      result: result,
    });
  } catch (err) {
    console.error('Error initiating barge:', err);
    res.status(500).json({ message: 'Failed to initiate barge', error: err.message });
  }
};

// GET /api/ami/extension-status — FIXED PARSING
exports.getExtensionStatus = async (req, res) => {
  try {
    if (!(await checkAdmin(req))) return res.status(403).json({ message: 'Admin access required' });

    const result = await amiCommand('pjsip show endpoints');
    const raw = getRaw(result);

    const extensions = [];
    const lines = raw.split('\n');
    for (const line of lines) {
      // Format: " Endpoint:  101/101                      Not in use    0 of inf"
      // or:    " Endpoint:  104/104                      Unavailable   0 of inf"
      const match = line.match(/Endpoint:\s+(\d{3})\/\d{3}\s+(Not in use|In use|Unavailable|Ringing)/i);
      if (match) {
        extensions.push({
          extension: match[1],
          status: match[2],
        });
      }
    }

    res.json({ extensions });
  } catch (err) {
    console.error('Error getting extension status:', err);
    res.status(500).json({ message: 'Failed to get extension status' });
  }
};

// ========== QUEUE MANAGEMENT ==========

// GET /api/ami/queue/status — get queue members, callers, stats
exports.getQueueStatus = async (req, res) => {
  try {
    if (!(await checkAdmin(req))) return res.status(403).json({ message: 'Admin access required' });

    const result = await amiCommand('queue show inbound');
    const raw = getRaw(result);

    // Parse queue info
    const members = [];
    const callers = [];
    let strategy = 'ringall';
    let calls = 0;
    let holdtime = 0;
    let talktime = 0;
    let completed = 0;
    let abandoned = 0;

    const lines = raw.split('\n');

    // First line: "inbound has 0 calls (max unlimited) in 'ringall' strategy (0s holdtime, 0s talktime), W:0, C:0, A:0, SL:0.0%, SL2:0.0% within 0s"
    const headerMatch = lines[0] && lines[0].match(/has\s+(\d+)\s+calls.*?'(\w+)'\s+strategy.*?(\d+)s\s+holdtime.*?(\d+)s\s+talktime.*?C:(\d+).*?A:(\d+)/);
    if (headerMatch) {
      calls = parseInt(headerMatch[1]);
      strategy = headerMatch[2];
      holdtime = parseInt(headerMatch[3]);
      talktime = parseInt(headerMatch[4]);
      completed = parseInt(headerMatch[5]);
      abandoned = parseInt(headerMatch[6]);
    }

    let inMembers = false;
    let inCallers = false;

    for (const line of lines) {
      if (line.includes('Members:') || line.includes('No Members')) {
        inMembers = true;
        inCallers = false;
        continue;
      }
      if (line.includes('Callers:') || line.includes('No Callers')) {
        inMembers = false;
        inCallers = true;
        continue;
      }

      if (inMembers && line.trim()) {
        // Format: "      Local/101@internal (ringinuse disabled) (Not in use) has taken 0 calls (last was 0 secs ago)"
        // or:     "      PJSIP/101 (ringinuse disabled) (In use) has taken 2 calls (last was 120 secs ago)"
        const memberMatch = line.match(/(?:Local\/(\d+)@internal|PJSIP\/(\d+)).*?\((Not in use|In use|Unavailable|Ringing|Unknown|Invalid)\)(?:\s*\((paused)\))?\s*has taken\s+(\d+)\s+calls/i);
        if (memberMatch) {
          const ext = memberMatch[1] || memberMatch[2];
          const interface_str = memberMatch[1] ? `Local/${ext}@internal` : `PJSIP/${ext}`;
          members.push({
            extension: ext,
            interface: interface_str,
            status: memberMatch[3],
            paused: !!memberMatch[4],
            callsTaken: parseInt(memberMatch[5]) || 0,
          });
        }
      }

      if (inCallers && line.trim()) {
        // Format: "      1. PJSIP/therealpbx-00000001 (wait: 0:05, prio: 0)"
        const callerMatch = line.match(/(\d+)\.\s+(\S+)\s+\(wait:\s*([\d:]+)/);
        if (callerMatch) {
          callers.push({
            position: parseInt(callerMatch[1]),
            channel: callerMatch[2],
            waitTime: callerMatch[3],
          });
        }
      }
    }

    res.json({
      queue: 'inbound',
      strategy,
      calls,
      holdtime,
      talktime,
      completed,
      abandoned,
      members,
      callers,
    });
  } catch (err) {
    console.error('Error getting queue status:', err);
    res.status(500).json({ message: 'Failed to get queue status' });
  }
};

// POST /api/ami/queue/add-member — add extension to queue
exports.addQueueMember = async (req, res) => {
  try {
    if (!(await checkAdmin(req))) return res.status(403).json({ message: 'Admin access required' });

    const { extension } = req.body;
    if (!extension || !/^\d{3}$/.test(extension)) {
      return res.status(400).json({ message: 'Valid 3-digit extension required' });
    }

    const result = await amiAction({
      action: 'QueueAdd',
      queue: 'inbound',
      interface: `Local/${extension}@internal`,
      membername: `Ext ${extension}`,
      penalty: '0',
    });

    res.json({ message: `Extension ${extension} added to inbound queue`, result });
  } catch (err) {
    console.error('Error adding queue member:', err);
    // Check if already a member
    if (err.message && err.message.includes('already')) {
      return res.status(400).json({ message: `Extension ${req.body.extension} is already in the queue` });
    }
    res.status(500).json({ message: 'Failed to add member to queue', error: err.message });
  }
};

// POST /api/ami/queue/remove-member — remove extension from queue
exports.removeQueueMember = async (req, res) => {
  try {
    if (!(await checkAdmin(req))) return res.status(403).json({ message: 'Admin access required' });

    const { extension } = req.body;
    if (!extension || !/^\d{3}$/.test(extension)) {
      return res.status(400).json({ message: 'Valid 3-digit extension required' });
    }

    const result = await amiAction({
      action: 'QueueRemove',
      queue: 'inbound',
      interface: `Local/${extension}@internal`,
    });

    res.json({ message: `Extension ${extension} removed from inbound queue`, result });
  } catch (err) {
    console.error('Error removing queue member:', err);
    res.status(500).json({ message: 'Failed to remove member from queue', error: err.message });
  }
};

// POST /api/ami/queue/pause-member — pause/unpause member
exports.pauseQueueMember = async (req, res) => {
  try {
    if (!(await checkAdmin(req))) return res.status(403).json({ message: 'Admin access required' });

    const { extension, paused } = req.body;
    if (!extension || !/^\d{3}$/.test(extension)) {
      return res.status(400).json({ message: 'Valid 3-digit extension required' });
    }

    const result = await amiAction({
      action: 'QueuePause',
      queue: 'inbound',
      interface: `Local/${extension}@internal`,
      paused: paused ? 'true' : 'false',
      reason: paused ? 'Admin paused' : 'Admin unpaused',
    });

    res.json({ message: `Extension ${extension} ${paused ? 'paused' : 'unpaused'} in queue`, result });
  } catch (err) {
    console.error('Error pausing queue member:', err);
    res.status(500).json({ message: 'Failed to pause/unpause member', error: err.message });
  }
};
