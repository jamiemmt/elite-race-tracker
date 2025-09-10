const express = require('express');
const router = express.Router();

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Banned athletes API is working', timestamp: new Date().toISOString() });
});

// Get list of banned athletes (known list only for now)
router.get('/list', (req, res) => {
  try {
    // Import service only when needed to avoid initialization issues
    const BannedAthleteService = require('../services/bannedAthleteService2');
    const bannedAthleteService = new BannedAthleteService();
    
    // Return just the known banned athletes list for immediate response
    const knownBanned = bannedAthleteService.getKnownBannedAthletes();
    res.json({
      count: knownBanned.length,
      athletes: knownBanned
    });
  } catch (error) {
    console.error('Error fetching banned athletes:', error);
    res.status(500).json({ error: 'Failed to fetch banned athletes', details: error.message });
  }
});

// Update athlete ban status in database (use known list only for now)
router.post('/update', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService2');
    const bannedAthleteService = new BannedAthleteService();
    
    const result = await bannedAthleteService.updateAthleteBanStatusFromKnownList();
    res.json({
      message: 'Athlete ban status updated successfully',
      ...result
    });
  } catch (error) {
    console.error('Error updating athlete ban status:', error);
    res.status(500).json({ error: 'Failed to update athlete ban status' });
  }
});

// Check if a specific athlete is banned
router.get('/check/:name/:country', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService2');
    const bannedAthleteService = new BannedAthleteService();
    
    const { name, country } = req.params;
    const opt = (v, def=true) => (typeof v === 'string' ? !/^(?:0|false)$/i.test(v) : (v ?? def));
    const options = {
      matchMode: typeof req.query.matchMode === 'string' ? req.query.matchMode : 'cascade',
      ignoreCountryWhenUnknown: opt(req.query.ignoreCountryWhenUnknown, true),
      includeProvisional: opt(req.query.includeProvisional, true),
      includeFirstInstance: opt(req.query.includeFirstInstance, true),
      includePdf: opt(req.query.includePdf, true),
      includeKnown: opt(req.query.includeKnown, true),
    };
    const isBanned = await bannedAthleteService.isAthleteBanned(name, country, options);
    res.json({ name, country, isBanned });
  } catch (error) {
    console.error('Error checking athlete ban status:', error);
    res.status(500).json({ error: 'Failed to check athlete ban status' });
  }
});

// Get ban statistics by agency/source
router.get('/stats', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService2');
    const bannedAthleteService = new BannedAthleteService();
    
    const stats = await bannedAthleteService.getBanStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching ban statistics:', error);
    res.status(500).json({ error: 'Failed to fetch ban statistics' });
  }
});

// Get banned athletes from database with source information
router.get('/database', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService2');
    const bannedAthleteService = new BannedAthleteService();
    
    const bannedAthletes = await bannedAthleteService.getBannedAthletesFromDatabase();
    res.json(bannedAthletes);
  } catch (error) {
    console.error('Error fetching banned athletes from database:', error);
    res.status(500).json({ error: 'Failed to fetch banned athletes from database' });
  }
});

// Clean up invalid AIU entries (dates as names, etc.)
router.post('/cleanup-invalid', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService2');
    const bannedAthleteService = new BannedAthleteService();
    
    const result = await bannedAthleteService.cleanupInvalidAiuEntries();
    res.json({
      success: true,
      message: 'Invalid AIU entries cleaned up successfully',
      summary: result
    });
  } catch (error) {
    console.error('Error cleaning up invalid AIU entries:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to clean up invalid AIU entries',
      details: error.message 
    });
  }
});

// Populate database with all current AIU banned athletes from live sources
router.post('/populate-aiu', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService2');
    const bannedAthleteService = new BannedAthleteService();
    
    const result = await bannedAthleteService.populateAllCurrentAiuAthletes();
    res.json({
      success: true,
      message: 'AIU banned athletes populated successfully',
      summary: result
    });
  } catch (error) {
    console.error('Error populating AIU banned athletes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to populate AIU banned athletes',
      details: error.message 
    });
  }
});

// Upsert the combined AIU list to DB (more robust than source-by-source)
router.post('/sync-combined', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService2');
    const bannedAthleteService = new BannedAthleteService();

    const opt = (v, def=true) => (typeof v === 'string' ? !/^(?:0|false)$/i.test(v) : (v ?? def));
    const options = {
      includeProvisional: opt(req.query.includeProvisional, true),
      includeFirstInstance: opt(req.query.includeFirstInstance, true),
      includePdf: opt(req.query.includePdf, true),
      includeKnown: opt(req.query.includeKnown, true),
    };

    const result = await bannedAthleteService.syncCombinedAiuToDb(options);
    res.json({ success: true, message: 'Combined AIU list synced to DB', summary: result, options });
  } catch (error) {
    console.error('Error syncing combined AIU list:', error);
    res.status(500).json({ success: false, error: 'Failed to sync combined AIU list', details: error.message });
  }
});

// Preview AIU sources (non-destructive) and return combined counts + sample
router.get('/aiu/preview', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService2');
    const bannedAthleteService = new BannedAthleteService();

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
    const opt = (v, def=true) => (typeof v === 'string' ? !/^0|false$/i.test(v) : (v ?? def));
    const options = {
      includeProvisional: opt(req.query.includeProvisional, true),
      includeFirstInstance: opt(req.query.includeFirstInstance, true),
      includePdf: opt(req.query.includePdf, true),
    };
    const preview = await bannedAthleteService.getAiuPreview(limit, options);
    try {
      const sampleNames = (preview.sample || []).slice(0, 5).map(a => `${a.name} (${a.country})`).join(', ');
      console.log(`[AIU Preview] counts=${JSON.stringify(preview.counts)} errors=${preview.errors?.length || 0} sample=[${sampleNames}]`);
    } catch (_) {}
    res.json(preview);
  } catch (error) {
    console.error('Error generating AIU preview:', error);
    res.status(500).json({ error: 'Failed to generate AIU preview', details: error.message });
  }
});

// Compare AIU combined list with DB to find missing/unmarked athletes (read-only)
router.get('/aiu/compare', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService2');
    const bannedAthleteService = new BannedAthleteService();

    const limitMissing = req.query.limitMissing ? parseInt(req.query.limitMissing, 10) : 50;
    const limitPresent = req.query.limitPresent ? parseInt(req.query.limitPresent, 10) : 20;
    const opt = (v, def=true) => (typeof v === 'string' ? !/^0|false$/i.test(v) : (v ?? def));
    const options = {
      includeProvisional: opt(req.query.includeProvisional, true),
      includeFirstInstance: opt(req.query.includeFirstInstance, true),
      includePdf: opt(req.query.includePdf, true),
      matchMode: typeof req.query.matchMode === 'string' ? req.query.matchMode : 'cascade',
      ignoreCountryWhenUnknown: opt(req.query.ignoreCountryWhenUnknown, true),
    };
    const report = await bannedAthleteService.compareAiuWithDatabase(limitMissing, limitPresent, options);
    try {
      const miss = (report.sample?.missing || []).slice(0, 5).map(a => `${a.name} (${a.country})`).join(', ');
      console.log(`[AIU Compare] counts=${JSON.stringify(report.counts)} sourceCounts=${JSON.stringify(report.sourceCounts)} optionsUsed=${JSON.stringify(report.optionsUsed)} errors=${report.errors?.length || 0} sampleMissing=[${miss}]`);
    } catch (_) {}
    res.json(report);
  } catch (error) {
    console.error('Error comparing AIU list with database:', error);
    res.status(500).json({ error: 'Failed to compare AIU list with database', details: error.message });
  }
});

module.exports = router;
