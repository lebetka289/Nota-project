const express = require('express');
const router = express.Router();
const recordingsController = require('../controllers/recordings.controller');
const { authenticateToken, isAdmin, isBeatmakerOrAdmin } = require('../middlewares/auth');
const { uploadTrack } = require('../utils/upload');

router.post('/', authenticateToken, recordingsController.createRecording);
router.get('/', authenticateToken, recordingsController.getMyRecordings);
router.get('/paid', authenticateToken, isBeatmakerOrAdmin, recordingsController.getPaidRecordings);
router.get('/:id', authenticateToken, recordingsController.getRecordingById);
router.get('/all/list', authenticateToken, isAdmin, recordingsController.getAllRecordings);
router.put('/:id/status', authenticateToken, isAdmin, recordingsController.updateRecordingStatus);
router.post('/:id/upload-track', authenticateToken, isBeatmakerOrAdmin, uploadTrack.single('track'), recordingsController.uploadTrack);
router.post('/:id/send-track', authenticateToken, isBeatmakerOrAdmin, recordingsController.sendTrackToUser);

module.exports = router;
