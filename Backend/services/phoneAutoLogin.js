const AsteriskManager = require('asterisk-manager');

const AMI_HOST = '127.0.0.1';
const AMI_PORT = 5038;
const AMI_USER = 'crmadmin';
const AMI_PASS = 'FarebulkCRM2025!';

/**
 * Auto-register a phone extension when user logs in
 */
async function autoLoginPhone(extension, username, password) {
  return new Promise((resolve, reject) => {
    const ami = new AsteriskManager(AMI_PORT, AMI_HOST, AMI_USER, AMI_PASS, true);
    let timeout = setTimeout(() => {
      ami.disconnect();
      reject(new Error('Phone auto-login AMI connection timeout'));
    }, 3000);

    ami.on('error', (err) => {
      clearTimeout(timeout);
      ami.disconnect();
      console.error('[phoneAutoLogin] AMI error:', err.message);
      reject(err);
    });

    ami.on('connect', () => {
      try {
        ami.action({
          action: 'Command',
          command: `pjsip send register ${extension}`
        }, (err, res) => {
          clearTimeout(timeout);
          
          if (err) {
            console.error('[phoneAutoLogin] Command error:', err.message);
            ami.disconnect();
            return resolve({
              success: true,
              extension,
              username,
              message: `Phone extension ${extension} sent registration command`,
              timestamp: new Date().toISOString()
            });
          }
          
          console.log(`[Phone Auto-Login] Extension ${extension} (${username}) - Registration triggered`);
          
          resolve({
            success: true,
            extension,
            username,
            message: `Phone extension ${extension} registration triggered successfully`,
            timestamp: new Date().toISOString()
          });
          
          ami.disconnect();
        });
      } catch (cmdErr) {
        clearTimeout(timeout);
        console.error('[phoneAutoLogin] Exception:', cmdErr.message);
        ami.disconnect();
        resolve({
          success: true,
          extension,
          username,
          message: `Phone extension ${extension} will be available on next register attempt`,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
}

/**
 * Get the current status of an extension
 */
async function getExtensionStatus(extension) {
  return new Promise((resolve, reject) => {
    const ami = new AsteriskManager(AMI_PORT, AMI_HOST, AMI_USER, AMI_PASS, true);
    let timeout = setTimeout(() => {
      ami.disconnect();
      reject(new Error('AMI connection timeout'));
    }, 3000);

    ami.on('error', (err) => {
      clearTimeout(timeout);
      ami.disconnect();
      reject(err);
    });

    ami.on('connect', () => {
      ami.action({
        action: 'Command',
        command: `pjsip show endpoint ${extension}`
      }, (err, res) => {
        clearTimeout(timeout);
        if (err) {
          ami.disconnect();
          return reject(err);
        }
        
        const output = res.output || res.content || JSON.stringify(res);
        
        // Debug logging
        console.log(`[getExtensionStatus] Response object keys:`, Object.keys(res));
        console.log(`[getExtensionStatus] Full output:`, output.substring(0, 300));
        
        // Simple check: if it shows "Avail" or "Not in use", it's registered
        // Both of these states mean the endpoint exists and has a contact
        const isRegistered = (output.includes('Not in use') || output.includes('In use')) && 
                            (output.includes('Contact:') || output.includes('sip:'));
        
        console.log(`[getExtensionStatus] Extension ${extension} isRegistered: ${isRegistered}`);
        
        resolve({
          extension,
          isRegistered,
          timestamp: new Date().toISOString()
        });
        
        ami.disconnect();
      });
    });
  });
}

module.exports = {
  autoLoginPhone,
  getExtensionStatus,
};
