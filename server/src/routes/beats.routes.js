const express = require('express');
const router = express.Router();
const beatsController = require('../controllers/beats.controller');
const { authenticateToken, isBeatmakerOrAdmin } = require('../middlewares/auth');
const { upload } = require('../utils/upload');

router.get('/', beatsController.getAllBeats);
router.get('/purchased', authenticateToken, beatsController.getPurchasedBeats);
router.get('/me', authenticateToken, isBeatmakerOrAdmin, beatsController.getMyBeats);
router.post('/', authenticateToken, isBeatmakerOrAdmin, 
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), 
  beatsController.createBeat
);
router.post('/:id/play', beatsController.incrementPlayCount);
router.get('/:id/stream', beatsController.streamBeat);
router.get('/:id/download', authenticateToken, beatsController.downloadBeat);
router.put('/:id', authenticateToken, isBeatmakerOrAdmin, beatsController.updateBeat);
router.delete('/:id', authenticateToken, isBeatmakerOrAdmin, beatsController.deleteBeat);

module.exports = router;
