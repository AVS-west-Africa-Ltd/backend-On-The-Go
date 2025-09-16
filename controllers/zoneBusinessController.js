// controllers/zoneBusinessController.js
const { ZoneBusiness } = require('../models');
const XLSX = require('xlsx');
const fs = require('fs');

// ---- helpers ----
const log = (...a) => console.log('[zone]', ...a);

function parseNotes(val) {
  try {
    if (Array.isArray(val)) return val;
    if (val == null) return [];
    if (typeof val === 'string') {
      const t = val.trim();
      if (!t) return [];
      const j = JSON.parse(t);
      return Array.isArray(j) ? j : [];
    }
    if (val instanceof Buffer || ArrayBuffer.isView(val)) {
      const text = Buffer.from(val).toString('utf8');
      const j = JSON.parse(text);
      return Array.isArray(j) ? j : [];
    }
    return [];
  } catch {
    return [];
  }
}

// ---- auth ----
const login = (req, res) => {
  const { username, password } = req.body;
  const users = [
    { username: 'regular', password: 'regular123', role: 'regular' },
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'superadmin', password: 'superadmin123', role: 'superadmin' },
    { username: 'ayo', password: '1234', role: 'superadmin' },
    { username: 'joe', password: '1234', role: 'superadmin' },
    { username: 'great', password: '1234', role: 'superadmin' },
  ];
  const user = users.find(u => u.username === username && u.password === password);
  if (user) return res.json({ message: 'Login successful', isLoggedIn: true, role: user.role });
  return res.status(401).json({ message: 'Invalid credentials' });
};

// ---- upload (bulk XLSX) ----
const uploadFiles = async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded', businesses: [] });
  }

  const newBusinesses = [];
  files.forEach((file) => {
    const workbook = XLSX.readFile(file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    const parsedData = jsonData.map((item) => {
      const latitude = parseFloat(item.latitude);
      const longitude = parseFloat(item.longitude);
      return {
        name: item.name,
        address: item.address,
        latitude: isNaN(latitude) ? null : latitude,
        longitude: isNaN(longitude) ? null : longitude,
        category: item.category,
        zone: item.zone,
        registered: false,
        verified: false,
        radius: 3000,
        notes: [],
      };
    });
    newBusinesses.push(...parsedData);
  });

  try {
    const existingBusinesses = await ZoneBusiness.findAll();
    const uniqueBusinesses = newBusinesses.filter(nb =>
      nb.latitude !== null && nb.longitude !== null &&
      !existingBusinesses.some(eb => eb.name === nb.name && eb.address === nb.address)
    );

    let created = [];
    if (uniqueBusinesses.length > 0) {
      created = await ZoneBusiness.bulkCreate(uniqueBusinesses);
    }
    res.json({ message: 'Files uploaded successfully', businesses: created });
  } catch (err) {
    res.status(500).json({ message: 'Error saving businesses to database', businesses: [] });
  }
};

// ---- NEW: create single business (JSON) ----
const createBusiness = async (req, res) => {
  try {
    const {
      name,
      address,
      latitude,
      longitude,
      category,
      zone,
      registered,
      verified,
      radius,
      notes,
    } = req.body || {};

    // trim + coerce
    const payload = {
      name: String(name || '').trim(),
      address: String(address || '').trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      category: String(category || '').trim(),
      zone: String(zone || '').trim(),
      registered: Boolean(registered ?? false),
      verified: Boolean(verified ?? false),
      radius: Number.isFinite(Number(radius)) ? Number(radius) : 3000,
      notes: parseNotes(notes),
    };

    // validate required model fields
    const missing = [];
    if (!payload.name) missing.push('name');
    if (!payload.address) missing.push('address');
    if (!Number.isFinite(payload.latitude)) missing.push('latitude');
    if (!Number.isFinite(payload.longitude)) missing.push('longitude');
    if (!payload.category) missing.push('category');
    if (!payload.zone) missing.push('zone');
    if (missing.length) {
      return res.status(400).json({ message: `Missing required field(s): ${missing.join(', ')}` });
    }

    // duplicate checks: name+address OR same lat/lng
    const dup = await ZoneBusiness.findOne({
      where: {
        name: payload.name,
        address: payload.address,
      },
    });
    if (dup) {
      return res.status(409).json({
        message: 'Business already exists (by name+address)',
        id: dup.id,
      });
    }

    const dupCoords = await ZoneBusiness.findOne({
      where: {
        latitude: payload.latitude,
        longitude: payload.longitude,
      },
    });
    if (dupCoords) {
      return res.status(409).json({
        message: 'Business already exists at these coordinates',
        id: dupCoords.id,
      });
    }

    const created = await ZoneBusiness.create(payload);
    return res.status(201).json({ message: 'Business created', business: created });
  } catch (err) {
    console.error('[createBusiness] error:', err);
    return res.status(500).json({ message: 'Error creating business' });
  }
};

// ---- register / unregister / verify ----
const registerBusiness = async (req, res) => {
  const { id } = req.params;
  const { radius, username } = req.body;

  const reqId =
    req.headers['x-request-id'] ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const start = Date.now();

  console.log(
    `[registerBusiness][start] reqId=${reqId} method=${req.method} url=${req.originalUrl} ip=${req.ip} ua="${req.headers['user-agent'] || ''}"`
  );
  console.log(
    `[registerBusiness][inputs] reqId=${reqId} id=${id} body=${JSON.stringify(
      { radius, username },
    )} params=${JSON.stringify(req.params)} query=${JSON.stringify(req.query)} x-api-key=${
      req.headers['x-api-key'] ? 'present' : 'absent'
    }`
  );

  try {
    const payload = { registered: true, radius: radius || 3000 };
    const where = { id };

    console.log(
      `[registerBusiness][update.call] reqId=${reqId} model=ZoneBusiness payload=${JSON.stringify(
        payload,
      )} where=${JSON.stringify(where)}`
    );

    const [updated] = await ZoneBusiness.update(payload, { where });

    console.log(
      `[registerBusiness][update.result] reqId=${reqId} affected=${updated} typeof=${typeof updated}`
    );

    if (updated) {
      log(`Business ${id} registered successfully with radius ${radius || 3000}`, username);
      console.log(
        `[registerBusiness][success] reqId=${reqId} id=${id} radius=${radius || 3000} status=200`
      );
      res.json({ message: 'Business registered successfully' });
    } else {
      log(`Business ${id} not found`, username);
      console.warn(`[registerBusiness][not_found] reqId=${reqId} id=${id} status=404`);
      res.status(404).json({ message: 'Business not found' });
    }
  } catch (err) {
    log(`Error registering business ${id}: ${err.message}`, username);
    console.error(
      `[registerBusiness][error] reqId=${reqId} id=${id} name=${err.name} code=${err.code || ''} message=${err.message}`
    );
    console.error(`[registerBusiness][stack] reqId=${reqId}\n${err.stack}`);
    res.status(500).json({ message: 'Error registering business' });
  } finally {
    const durationMs = Date.now() - start;
    console.log(
      `[registerBusiness][finish] reqId=${reqId} id=${id} status=${res.statusCode} durationMs=${durationMs}`
    );
  }
};

const unregisterBusiness = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (password !== 'password') return res.status(401).json({ message: 'Incorrect password' });
  try {
    const [updated] = await ZoneBusiness.update({ registered: false }, { where: { id } });
    if (!updated) return res.status(404).json({ message: 'Business not found' });
    res.json({ message: 'Business unregistered successfully' });
  } catch {
    res.status(500).json({ message: 'Error unregistering business' });
  }
};

const verifyBusiness = async (req, res) => {
  const { id } = req.params;
  try {
    const b = await ZoneBusiness.findByPk(id);
    if (!b) return res.status(404).json({ message: 'Business not found' });
    const next = !b.verified;
    await ZoneBusiness.update({ verified: next }, { where: { id } });
    res.json({ message: 'Business verification status updated', business: { ...b.toJSON(), verified: next } });
  } catch {
    res.status(500).json({ message: 'Error toggling verification' });
  }
};

// ---- list businesses (normalize notes to array) ----
const getBusinesses = async (_req, res) => {
  try {
    const rows = await ZoneBusiness.findAll({ raw: true });
    const businesses = rows.map((r) => ({ ...r, notes: parseNotes(r.notes) }));
    res.json({ businesses });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching businesses' });
  }
};

// ---- logs ----
const getLogs = (_req, res) => {
  try {
    const logs = fs.readFileSync('server.log', 'utf-8');
    res.json({ logs });
  } catch {
    res.status(500).json({ message: 'Error reading logs' });
  }
};

// ---- notes ----
const addBusinessNote = async (req, res) => {
  const { id } = req.params;
  const { name, note } = req.body;

  const cleanedName = String(name || '').trim();
  const cleanedNote = String(note || '').trim();
  if (!cleanedName || !cleanedNote) return res.status(400).json({ message: 'Both name and note are required' });

  try {
    const business = await ZoneBusiness.findByPk(id);
    if (!business) return res.status(404).json({ message: 'Business not found' });

    const existing = Array.isArray(business.notes) ? business.notes : [];
    const entry = {
      name: cleanedName,
      note: cleanedNote,
      createdAt: new Date().toISOString(),
      imagePath: req.file ? `/uploads/${req.file.filename}` : null,
      imageType: req.file ? req.file.mimetype : null,
    };

    const updatedNotes = [...existing, entry];
    await business.update({ notes: updatedNotes });
    return res.status(201).json({ message: 'Note added', businessId: id, note: entry, notesCount: updatedNotes.length });
  } catch {
    return res.status(500).json({ message: 'Error adding note' });
  }
};

module.exports = {
  login,
  uploadFiles,
  createBusiness,          // <- new export
  registerBusiness,
  unregisterBusiness,
  verifyBusiness,
  getBusinesses,
  getLogs,
  addBusinessNote,
};
