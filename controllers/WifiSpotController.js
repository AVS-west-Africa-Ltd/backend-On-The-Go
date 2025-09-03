1// controllers/WifiSpotController.js
const { Op, Sequelize } = require('sequelize');
const { WifiSpot } = require('../models');
const { encrypt, decrypt } = require('../services/crypto');

const toNum = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const parseDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d;
};
const safeStr = (v, max = 255) => (v == null ? null : String(v).slice(0, max));

const normalizeRow = (n) => {
  // Accept both your viewer schema and the uploaded file schema
  const lat = toNum(n.lat ?? n.latitude);
  const lng = toNum(n.lng ?? n.longitude);
  return {
    ssid: safeStr(n.ssid, 128),
    bssid: safeStr(n.bssid, 32),
    password: n.password == null ? null : String(n.password),
    latitude: lat,
    longitude: lng,
    platform: safeStr(n.platform || platformFromSource(n.source), 32),
    capturedAt: parseDate(n.capturedAt || n.collected_at),
    source_ip: null,
    submitted_by: n.submitted_by ?? null,
    approved: n.approved ?? true,

    // extra wifi metadata
    security: safeStr(n.security, 64),
    capabilities: n.capabilities ?? null,
    provider: safeStr(n.provider, 128),
    shared_by: safeStr(n.shared_by, 128),
    last_signal: safeStr(n.last_signal, 64),
    last_connection: safeStr(n.last_connection, 64),
    connections: toNum(n.connections),
    download_speed_mbps: toNum(n.download_speed_mbps ?? n.downloadSpeedMbps),
    upload_speed_mbps: toNum(n.upload_speed_mbps ?? n.uploadSpeedMbps),
    ping_ms: toNum(n.ping_ms ?? n.pingMs),
    rssi_dbm: toNum(n.rssi_dbm ?? n.rssiDbm),
    frequency_mhz: toNum(n.frequency_mhz ?? n.frequencyMhz),
    channel: toNum(n.channel),
    band: safeStr(n.band, 16),
    address: n.address ?? null,
    source: safeStr(n.source, 128),
    notes: n.notes ?? null,
  };
};

function platformFromSource(src) {
  const s = String(src || '').toLowerCase();
  if (!s) return null;
  if (s.includes('wifi map')) return 'wifi-map';
  if (s.includes('screenshot')) return 'screenshot';
  if (s.includes('public')) return 'public';
  return s.slice(0, 32) || null;
}

function toPublicRow(row, includePassword = false) {
  return {
    id: row.id,
    ssid: row.ssid,
    bssid: row.bssid,
    password: includePassword ? (row.password_enc ? decrypt(row.password_enc) : null) : undefined,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    platform: row.platform,
    capturedAt: row.capturedAt,
    security: row.security,
    capabilities: row.capabilities,
    provider: row.provider,
    shared_by: row.shared_by,
    last_signal: row.last_signal,
    last_connection: row.last_connection,
    connections: row.connections,
    download_speed_mbps: row.download_speed_mbps,
    upload_speed_mbps: row.upload_speed_mbps,
    ping_ms: row.ping_ms,
    rssi_dbm: row.rssi_dbm,
    frequency_mhz: row.frequency_mhz,
    channel: row.channel,
    band: row.band,
    address: row.address,
    source: row.source,
    notes: row.notes,
    approved: row.approved,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

exports.create = async (req, res) => {
  try {
    const {
      ssid, password, latitude, longitude,
      platform, capturedAt, submitted_by,
      bssid, security, capabilities, provider, shared_by,
      last_signal, last_connection, connections,
      download_speed_mbps, upload_speed_mbps, ping_ms,
      rssi_dbm, frequency_mhz, channel, band, address, source, notes,
      approved,
    } = req.body || {};

    if (!ssid || typeof ssid !== 'string') return res.status(400).json({ success:false, message:'ssid is required' });
    const lat = Number(latitude), lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success:false, message:'latitude/longitude are required numeric values' });
    }

    const spot = await WifiSpot.create({
      ssid: String(ssid).trim(),
      password_enc: password ? encrypt(String(password)) : null,
      latitude: lat,
      longitude: lng,
      platform: platform || null,
      capturedAt: capturedAt ? new Date(capturedAt) : null,
      source_ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null,
      submitted_by: submitted_by || null,
      approved: approved ?? true,

      bssid: bssid || null, security: security || null, capabilities: capabilities || null,
      provider: provider || null, shared_by: shared_by || null,
      last_signal: last_signal || null, last_connection: last_connection || null,
      connections: toNum(connections),
      download_speed_mbps: toNum(download_speed_mbps),
      upload_speed_mbps: toNum(upload_speed_mbps),
      ping_ms: toNum(ping_ms),
      rssi_dbm: toNum(rssi_dbm),
      frequency_mhz: toNum(frequency_mhz),
      channel: toNum(channel),
      band: band || null,
      address: address || null,
      source: source || null,
      notes: notes || null,
    });

    return res.status(201).json({ success:true, data: { id: spot.id } });
  } catch (e) {
    console.error('WifiSpot.create error', e);
    return res.status(500).json({ success:false, message:e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const spot = await WifiSpot.findByPk(req.params.id);
    if (!spot) return res.status(404).json({ success:false, message:'Not found' });
    return res.json({ success:true, data: toPublicRow(spot, true) });
  } catch (e) {
    console.error('WifiSpot.getById error', e);
    return res.status(500).json({ success:false, message:e.message });
  }
};

exports.list = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 50));
    const q = (req.query.q || '').trim();
    const platform = req.query.platform || null;
    const approved = req.query.approved == null ? null : req.query.approved === 'true';
    const order = req.query.order || 'createdAt:DESC'; // or last_signal, etc.

    const where = {};
    if (q) where.ssid = { [Op.iLike]: `%${q}%` };
    if (platform) where.platform = platform;
    if (approved !== null) where.approved = approved;

    const [col, dir] = order.split(':');
    const validCols = ['createdAt', 'updatedAt', 'capturedAt', 'ssid', 'platform'];
    const orderBy = validCols.includes(col) ? [[col, dir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']] : [['createdAt','DESC']];

    const { rows, count } = await WifiSpot.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: orderBy,
    });

    return res.json({
      success: true,
      meta: { page, pageSize, total: count, pages: Math.ceil(count / pageSize) },
      data: rows.map(r => toPublicRow(r, true)),
    });
  } catch (e) {
    console.error('WifiSpot.list error', e);
    return res.status(500).json({ success:false, message:e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const spot = await WifiSpot.findByPk(req.params.id);
    if (!spot) return res.status(404).json({ success:false, message:'Not found' });

    const payload = normalizeRow(req.body || {});
    if (payload.password != null) {
      payload.password_enc = payload.password ? encrypt(String(payload.password)) : null;
    }
    delete payload.password;

    // latitude/longitude optional on update; if provided, must be numeric
    if (payload.latitude != null && !Number.isFinite(Number(payload.latitude))) {
      return res.status(400).json({ success:false, message:'latitude must be numeric' });
    }
    if (payload.longitude != null && !Number.isFinite(Number(payload.longitude))) {
      return res.status(400).json({ success:false, message:'longitude must be numeric' });
    }

    await spot.update(payload);
    return res.json({ success:true, data: toPublicRow(spot, true) });
  } catch (e) {
    console.error('WifiSpot.update error', e);
    return res.status(500).json({ success:false, message:e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const spot = await WifiSpot.findByPk(req.params.id);
    if (!spot) return res.status(404).json({ success:false, message:'Not found' });
    await spot.destroy();
    return res.json({ success:true });
  } catch (e) {
    console.error('WifiSpot.remove error', e);
    return res.status(500).json({ success:false, message:e.message });
  }
};

exports.count = async (_req, res) => {
  try {
    const total = await WifiSpot.count();
    const approved = await WifiSpot.count({ where: { approved: true } });
    const unapproved = total - approved;
    return res.json({ success:true, total, approved, unapproved });
  } catch (e) {
    console.error('WifiSpot.count error', e);
    return res.status(500).json({ success:false, message:e.message });
  }
};

exports.near = async (req, res) => {
  try {
    const lat = Number(req.query.lat), lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success:false, message:'lat,lng query params required as numbers' });
    }
    const radiusKm = Math.min(50, Math.max(0.1, Number(req.query.radius_km) || 2));
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));

    // Haversine distance in km
    const distanceLiteral = Sequelize.literal(`
      6371 * acos(
        cos(radians(${lat}))
        * cos(radians("WifiSpot"."latitude"))
        * cos(radians("WifiSpot"."longitude") - radians(${lng}))
        + sin(radians(${lat})) * sin(radians("WifiSpot"."latitude"))
      )
    `);

    const rows = await WifiSpot.findAll({
      attributes: {
        include: [[distanceLiteral, 'distance_km']],
      },
      where: Sequelize.where(distanceLiteral, { [Op.lte]: radiusKm }),
      order: [[Sequelize.col('distance_km'), 'ASC']],
      limit,
    });

    const data = rows.map((s) => ({
      id: s.id,
      ssid: s.ssid,
      password: s.password_enc ? decrypt(s.password_enc) : null,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      distance_km: Number(s.get('distance_km')),
      platform: s.platform,
      capturedAt: s.capturedAt,
      approved: s.approved,
    }));

    return res.json({ success:true, data });
  } catch (e) {
    console.error('WifiSpot.near error', e);
    return res.status(500).json({ success:false, message:e.message });
  }
};

// -------- Bulk upload: JSON body ----------
exports.bulkUpload = async (req, res) => {
  try {
    const payload = Array.isArray(req.body?.networks) ? req.body.networks
                  : Array.isArray(req.body) ? req.body
                  : null;
    if (!payload || payload.length === 0) {
      return res.status(400).json({ success:false, message: 'Send { "networks": [...] } or a raw array' });
    }

    // Normalize and validate
    const rows = payload.map(normalizeRow).filter(r => Number.isFinite(r.latitude) && Number.isFinite(r.longitude) && r.ssid);
    if (!rows.length) return res.status(400).json({ success:false, message:'No valid rows with ssid + lat + lng' });

    // Build uniqueKey now for upsert logic
    const keyed = rows.map((r) => {
      const bssid = (r.bssid || '').trim().toLowerCase();
      const uniqueKey = bssid ? `bssid:${bssid}` : `ssid:${(r.ssid||'').trim().toLowerCase()}|lat:${r.latitude}|lng:${r.longitude}`;
      return { ...r, uniqueKey };
    });

    // fetch existing
    const keys = [...new Set(keyed.map(k => k.uniqueKey))];
    const existing = await WifiSpot.findAll({ where: { uniqueKey: keys } });
    const map = new Map(existing.map(e => [e.uniqueKey, e]));

    let created = 0, updated = 0;

    // Create new
    const toCreate = [];
    for (const r of keyed) {
      if (!map.has(r.uniqueKey)) {
        toCreate.push({
          ...r,
          password_enc: r.password ? encrypt(String(r.password)) : null,
        });
        created++;
      }
    }
    if (toCreate.length) await WifiSpot.bulkCreate(toCreate);

    // Update existing
    for (const r of keyed) {
      const e = map.get(r.uniqueKey);
      if (e) {
        const updatePayload = { ...r };
        if (r.password !== undefined) {
          updatePayload.password_enc = r.password ? encrypt(String(r.password)) : null;
        }
        delete updatePayload.password;
        await e.update(updatePayload);
        updated++;
      }
    }

    return res.status(201).json({ success:true, message:'processed', created, updated, total: keyed.length });
  } catch (e) {
    console.error('WifiSpot.bulkUpload error', e);
    return res.status(500).json({ success:false, message:e.message });
  }
};

// -------- Bulk upload: file (multipart/form-data; field: jsonFile) ----------
exports.bulkUploadFile = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success:false, message:'No file uploaded' });
    }
    const raw = req.file.buffer.toString('utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(400).json({ success:false, message:'Invalid JSON' });
    }
    req.body = parsed; // reuse bulkUpload flow
    return exports.bulkUpload(req, res);
  } catch (e) {
    console.error('WifiSpot.bulkUploadFile error', e);
    return res.status(500).json({ success:false, message:e.message });
  }
};

// -------- Export to viewer-friendly JSON ----------
exports.export = async (_req, res) => {
  try {
    const rows = await WifiSpot.findAll({ order: [['createdAt', 'DESC']], limit: 2000 });
    const networks = rows.map(r => ({
      ssid: r.ssid,
      bssid: r.bssid,
      password: r.password_enc ? decrypt(r.password_enc) : null,
      username: null,
      security: r.security,
      capabilities: r.capabilities,
      provider: r.provider,
      shared_by: r.shared_by,
      collected_at: r.capturedAt ? r.capturedAt.toISOString() : null,
      last_signal: r.last_signal,
      last_connection: r.last_connection,
      connections: r.connections,
      download_speed_mbps: r.download_speed_mbps,
      upload_speed_mbps: r.upload_speed_mbps,
      ping_ms: r.ping_ms,
      rssi_dbm: r.rssi_dbm,
      frequency_mhz: r.frequency_mhz,
      channel: r.channel,
      band: r.band,
      address: r.address,
      lat: Number(r.latitude),
      lng: Number(r.longitude),
      source: r.source || r.platform,
      notes: r.notes,
    }));
    return res.json({ networks });
  } catch (e) {
    console.error('WifiSpot.export error', e);
    return res.status(500).json({ success:false, message:e.message });
  }
};
