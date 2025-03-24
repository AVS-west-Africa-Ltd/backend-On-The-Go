// controllers/zoneBusinessController.js
const ZoneBusiness = require('../models/ZoneBusiness');
const XLSX = require('xlsx');
const fs = require('fs');
const log = require('../utils/logger'); // Assuming you have a logger utility

const login = (req, res) => {
  const { username, password } = req.body;
  log(`Login attempt: username=${username}, password=${password}`, username);

  const users = [
    { username: 'regular', password: 'regular123', role: 'regular' },
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'superadmin', password: 'superadmin123', role: 'superadmin' },
    { username: 'ayo', password: '1234', role: 'superadmin' },
    { username: 'joe', password: '1234', role: 'superadmin' },
    { username: 'great', password: '1234', role: 'superadmin' },
  ];

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    log(`Login successful for user: ${username}, role: ${user.role}`, username);
    res.json({ message: 'Login successful', isLoggedIn: true, role: user.role });
  } else {
    log('Login failed: Invalid credentials', username);
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

const uploadFiles = async (req, res) => {
  const files = req.files;
  log(`File upload request received. Files: ${files ? files.length : 0}`);

  if (!files || files.length === 0) {
    log('No files uploaded');
    return res.status(400).json({ message: 'No files uploaded', businesses: [] });
  }

  const newBusinesses = [];

  files.forEach((file) => {
    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    const parsedData = jsonData.map((item) => {
      const latitude = parseFloat(item.latitude);
      const longitude = parseFloat(item.longitude);

      return {
        name: item.name,
        address: item.address,
        latitude: isNaN(latitude) ? null : latitude, // Ensure valid latitude
        longitude: isNaN(longitude) ? null : longitude, // Ensure valid longitude
        category: item.category,
        zone: item.zone,
        registered: false,
      };
    });

    newBusinesses.push(...parsedData);
  });

  log(`Parsed ${newBusinesses.length} businesses from uploaded files`);

  try {
    const existingBusinesses = await ZoneBusiness.findAll();
    const uniqueBusinesses = newBusinesses.filter(newBusiness => {
      return newBusiness.latitude !== null && newBusiness.longitude !== null && // Filter invalid coordinates
        !existingBusinesses.some(existingBusiness =>
          existingBusiness.name === newBusiness.name &&
          existingBusiness.address === newBusiness.address
        );
    });

    log(`Filtered out duplicates and invalid entries. ${uniqueBusinesses.length} unique businesses to insert.`);

    let createdBusinesses = [];
    if (uniqueBusinesses.length > 0) {
      createdBusinesses = await ZoneBusiness.bulkCreate(uniqueBusinesses);
      log(`Successfully inserted ${createdBusinesses.length} businesses into the database`);
    } else {
      log('No new businesses to insert after filtering.');
    }

    res.json({ message: 'Files uploaded successfully', businesses: createdBusinesses });
  } catch (err) {
    log(`Error inserting businesses: ${err.message}`);
    res.status(500).json({ message: 'Error saving businesses to database', businesses: [] });
  }
};

const registerBusiness = async (req, res) => {
  const { id } = req.params;
  const { radius, username } = req.body;
  log(`Register business request received. Business ID: ${id}, Radius: ${radius}`, username);

  try {
    const [updated] = await ZoneBusiness.update({ registered: true, radius: radius || 3000 }, { where: { id } });
    if (updated) {
      log(`Business ${id} registered successfully with radius ${radius || 3000}`, username);
      res.json({ message: 'Business registered successfully' });
    } else {
      log(`Business ${id} not found`, username);
      res.status(404).json({ message: 'Business not found' });
    }
  } catch (err) {
    log(`Error registering business ${id}: ${err.message}`, username);
    res.status(500).json({ message: 'Error registering business' });
  }
};

const unregisterBusiness = async (req, res) => {
  const { id } = req.params;
  const { password, username } = req.body;
  log(`Unregister business request received. Business ID: ${id}, Password: ${password}`, username);

  if (password !== 'password') {
    log('Unregister failed: Incorrect password', username);
    return res.status(401).json({ message: 'Incorrect password' });
  }

  try {
    const [updated] = await ZoneBusiness.update({ registered: false }, { where: { id } });
    if (updated) {
      log(`Business ${id} unregistered successfully`, username);
      res.json({ message: 'Business unregistered successfully' });
    } else {
      log(`Business ${id} not found`, username);
      res.status(404).json({ message: 'Business not found' });
    }
  } catch (err) {
    log(`Error unregistering business ${id}: ${err.message}`, username);
    res.status(500).json({ message: 'Error unregistering business' });
  }
};

const getBusinesses = async (req, res) => {
  log('Fetching all businesses');

  try {
    const businesses = await ZoneBusiness.findAll();
    log(`Fetched ${businesses.length} businesses`);
    res.json({ businesses });
  } catch (err) {
    log(`Error fetching businesses: ${err.message}`);
    res.status(500).json({ message: 'Error fetching businesses' });
  }
};

const verifyBusiness = async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;
  log(`Verify business request received. Business ID: ${id}`, username);

  try {
    const business = await ZoneBusiness.findByPk(id);
    if (business) {
      const updated = await ZoneBusiness.update(
        { verified: !business.verified },
        { where: { id } }
      );
      if (updated) {
        log(`Business ${id} verification status toggled to ${!business.verified}`, username);
        res.json({ message: 'Business verification status updated', business: { ...business.dataValues, verified: !business.verified } });
      } else {
        log(`Business ${id} not found`, username);
        res.status(404).json({ message: 'Business not found' });
      }
    } else {
      log(`Business ${id} not found`, username);
      res.status(404).json({ message: 'Business not found' });
    }
  } catch (err) {
    log(`Error toggling verification for business ${id}: ${err.message}`, username);
    res.status(500).json({ message: 'Error toggling verification' });
  }
};

const getLogs = (req, res) => {
  try {
    const logs = fs.readFileSync('server.log', 'utf-8');
    res.json({ logs });
  } catch (err) {
    log(`Error reading logs: ${err.message}`);
    res.status(500).json({ message: 'Error reading logs' });
  }
};

module.exports = {
  login,
  uploadFiles,
  registerBusiness,
  unregisterBusiness,
  getBusinesses,
  verifyBusiness,
  getLogs,
};