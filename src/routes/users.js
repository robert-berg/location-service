let express = require('express');
let router = express.Router();

const mongoCRUDs = require('../db/mongoCRUDs');

// Wird bei POST http://localhost:8000/users aufgerufen
router.post('/', async function (req, res) {
  try {
    const {username, password} = req.body;

    if (!username || !password) {
      return res.status(400).send('Username and password are required');
    }

    let user = await mongoCRUDs.findOneUser(username, password);
    if (user) {
      res.status(200).json({message: 'Login successful', user});
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
