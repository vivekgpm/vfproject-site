const express = require('express');
const router = express.Router();
const userController = require('./controllers/userController');

// User routes
router.get('/users', userController.listUsers);
router.post('/users', userController.createNewUser);
router.get('/users/:userId', userController.getUserById);
router.put('/users/:userId', userController.updateUser);
router.delete('/users/:userId', userController.deleteUser);

// Plan routes
router.get('/plans', userController.getPlanData);

module.exports = router;
