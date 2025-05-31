const express = require('express');
const router = express.Router();

// Hello World endpoint
router.get('/hello', (req, res) => {
    console.log('👋 Hello endpoint hit');
    res.json({ message: 'Hello, World!' });
});

// Hello with name endpoint
router.get('/hello/:name', (req, res) => {
    const name = req.params.name;
    console.log(`👋 Hello ${name} endpoint hit`);
    res.json({ message: `Hello, ${name}!` });
});

module.exports = router;
