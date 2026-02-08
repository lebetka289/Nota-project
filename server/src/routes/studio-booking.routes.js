const express = require('express');
const router = express.Router();
const studioBookingController = require('../controllers/studio-booking.controller');
const { authenticateToken, isBeatmakerOrAdmin } = require('../middlewares/auth');

router.post('/', studioBookingController.submitBooking);
router.post('/with-music', studioBookingController.submitWithMusicClarification);
router.post('/home-recording', studioBookingController.submitHomeRecordingClarification);
router.get('/list', authenticateToken, isBeatmakerOrAdmin, studioBookingController.getListForBeatmaker);
router.get('/:id', authenticateToken, studioBookingController.getBookingById);
router.patch('/:id/status', authenticateToken, isBeatmakerOrAdmin, studioBookingController.updateBookingStatus);

module.exports = router;
