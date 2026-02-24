const express = require('express');
const router = express.Router();
const studioBookingController = require('../controllers/studio-booking.controller');
const { authenticateToken, isBeatmakerOrAdmin } = require('../middlewares/auth');

router.post('/', studioBookingController.submitBooking);
router.post('/with-music', studioBookingController.submitWithMusicClarification);
router.post('/home-recording', studioBookingController.submitHomeRecordingClarification);
router.get('/beatmakers', studioBookingController.getBeatmakers);
router.get('/availability/:beatmakerId', studioBookingController.getBeatmakerAvailability);
router.get('/working-days', authenticateToken, isBeatmakerOrAdmin, studioBookingController.getWorkingDays);
router.put('/working-days', authenticateToken, isBeatmakerOrAdmin, studioBookingController.setWorkingDays);
router.post('/working-days', authenticateToken, isBeatmakerOrAdmin, studioBookingController.toggleWorkingDay);
router.get('/working-days/beatmaker/:beatmakerId', studioBookingController.getWorkingDaysForBeatmaker);
router.get('/list', authenticateToken, isBeatmakerOrAdmin, studioBookingController.getListForBeatmaker);
router.get('/:id', authenticateToken, studioBookingController.getBookingById);
router.patch('/:id/status', authenticateToken, isBeatmakerOrAdmin, studioBookingController.updateBookingStatus);

module.exports = router;
