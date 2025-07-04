express = require('express');
const router = express.Router();
const verifyUser = require('../middleware/verifyUser');
const {
  authorizeUsPayment,
} = require('../controllers/AuthUSPayController');

router.post('/', verifyUser, authorizeUsPayment);


module.exports = router;