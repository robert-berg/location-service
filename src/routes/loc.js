let express = require('express');
let router = express.Router();

const mongoCRUDs = require('../db/mongoCRUDs');
const { ObjectId } = require('mongodb');

// POST /loc with new location in the payload
router.post('/', async function(req, res) {
  try {
    const newLocation = req.body;

    if (!isValidLocation(newLocation)) {
      return res.status(400).send('Invalid Request Body');
    }

    const newId = await mongoCRUDs.createLocation(newLocation);
    res.status(201).location(`/${newId}`).send();
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// GET /loc - get all locations
router.get('/', async function(req, res) {
  try {
    const locations = await mongoCRUDs.readLocations();
    res.status(200).json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// GET /loc/:id - get a specific location by ID
router.get('/:id', async function(req, res) {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send('Invalid ID');
    }

    const location = await mongoCRUDs.readLocation(id);
    if (location) {
      res.status(200).json(location);
    } else {
      res.status(404).send('Location not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// PUT /loc/:id - update a location
router.put('/:id', async function(req, res) {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send('Invalid ID');
    }

    const updateData = req.body;

    if (!isValidLocation(updateData)) {
      return res.status(400).send('Invalid Request Body');
    }

    const result = await mongoCRUDs.updateLocation(id, updateData);
    if (result.success) {
      res.status(204).send();
    } else {
      res.status(404).send(result.message);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// DELETE /loc/:id - delete a location
router.delete('/:id', async function(req, res) {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send('Invalid ID');
    }

    const result = await mongoCRUDs.deleteLocation(id);
    if (result.success) {
      res.status(204).send();
    } else {
      res.status(404).send(result.message);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Validate the location against the expected pattern
function isValidLocation(newLocation) {
  return (
    newLocation &&
    typeof newLocation.title === 'string' &&
    typeof newLocation.description === 'string' &&
    typeof newLocation.street === 'string' &&
    typeof newLocation.zip === 'string' &&
    typeof newLocation.city === 'string' &&
    typeof newLocation.state === 'string' &&
    typeof newLocation.lat === 'number' &&
    typeof newLocation.lon === 'number' &&
    newLocation.lat >= -90 && newLocation.lat <= 90 && // Latitude range validation
    newLocation.lon >= -180 && newLocation.lon <= 180 // Longitude range validation
  );
}

module.exports = router;
