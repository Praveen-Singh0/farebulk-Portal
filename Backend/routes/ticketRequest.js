const express = require('express');
const router = express.Router();

const { getAll, create, update } = require('../controllers/ticketRequestController');

router.get('/', getAll);
router.post('/', create);

router.put('/:id', update);

module.exports = router;
