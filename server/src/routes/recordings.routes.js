const express = require('express');
const router = express.Router();
const recordingsController = require('../controllers/recordings.controller');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

router.post('/', authenticateToken, recordingsController.createRecording);
router.get('/', authenticateToken, recordingsController.getMyRecordings);
router.get('/:id', authenticateToken, recordingsController.getRecordingById);
router.get('/all/list', authenticateToken, isAdmin, recordingsController.getAllRecordings);
router.put('/:id/status', authenticateToken, isAdmin, recordingsController.updateRecordingStatus);

module.exports = router;
