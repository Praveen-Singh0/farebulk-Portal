const mongoose = require('mongoose');

const trunkConfigSchema = new mongoose.Schema(
  {
    agentName: {
      type: String,
      default: '',
    },
    agentPhone: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrunkConfig', trunkConfigSchema);
