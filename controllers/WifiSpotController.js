const { Op, Sequelize } = require('sequelize');
const { WifiSpot } = require('../models');
const { encrypt, decrypt } = require('../services/crypto');

function pick(obj, keys = []) { return keys.reduce((a,k)=>{ if (obj[k] !== undefined) a[k]=obj[k]; return a; },{}); }

exports.create = async (req, res) => {
  try {
    const { ssid, password, latitude, longitude, platform, capturedAt, submitted_by } = req.body || {};

    if (!ssid || typeof ssid !== 'string') return res.status(400).json({ success:false, message:'ssid is required' });
    const lat = Number(latitude), lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ success:false, message:'latitude/longitude are required numeric values' });

    const spot = await WifiSpot.create({
      ssid: String(ssid).trim(),
      password_enc: password ? encrypt(String(password)) : null,
      latitude: lat,
      longitude: lng,
      platform: platform || null,
      capturedAt: capturedAt ? new Date(capturedAt) : null,
      source_ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null,
      submitted_by: submitted_by || null,
      approved: true,
    });

    return res.status(201).json({ success:true, data: { id: spot.id } });
  } catch (e) {
    console.error('WifiSpot.create error', e);
    return res.status(500).json({ success:false, message:e.message });
  }
};

exports.count = async (_req, res) => {
  try {
    const total = await WifiSpot.count({ where: { approved: true } });
    // allow either a raw number or {count} – your app reads either
    return res.json({ count: total });
  } catch (e) {
    return res.status(500).json({ success:false, message:e.message });
  }
};

exports.list = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const { rows, count } = await WifiSpot.findAndCountAll({
      where: { approved: true },
      order: [['createdAt','DESC']],
      limit, offset,
      attributes: ['id','ssid','password_enc','latitude','longitude','platform','capturedAt','createdAt']
    });

    const data = rows.map(r => ({
      id: r.id,
      ssid: r.ssid,
      password: r.password_enc ? decrypt(r.password_enc) : null,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      platform: r.platform,
      capturedAt: r.capturedAt,
      createdAt: r.createdAt,
    }));

    return res.json({ success:true, data, total: count, hasMore: count > offset + data.length });
  } catch (e) {
    return res.status(500).json({ success:false, message:e.message });
  }
};

exports.near = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Math.min(Number(req.query.radius_km) || 2, 50);
    const limit = Math.min(Number(req.query.limit) || 100, 200);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success:false, message:'lat and lng query params are required' });
    }

    // Haversine (works on MySQL & Postgres):
    const R = 6371; // km
    const haversine = (
      `${R} * acos(` +
      `cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) + ` +
      `sin(radians(${lat})) * sin(radians(latitude))`
      + `)`
    );

    const spots = await WifiSpot.findAll({
      where: { approved: true },
      attributes: [
        'id','ssid','password_enc','latitude','longitude','platform','capturedAt','createdAt',
        [Sequelize.literal(haversine), 'distance_km']
      ],
      order: Sequelize.literal('distance_km ASC'),
      having: Sequelize.literal(`distance_km <= ${radiusKm}`),
      limit,
    });

    const data = spots.map(s => ({
      id: s.id,
      ssid: s.ssid,
      password: s.password_enc ? decrypt(s.password_enc) : null,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      distance_km: Number(s.get('distance_km')),
      platform: s.platform,
      capturedAt: s.capturedAt,
      createdAt: s.createdAt,
    }));

    return res.json({ success:true, data });
  } catch (e) {
    console.error('WifiSpot.near error', e);
    return res.status(500).json({ success:false, message:e.message });
  }
};