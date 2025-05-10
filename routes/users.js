// routes/users.js
const express = require('express');
const router = express.Router();
const { 
  createNewUser, 
  listUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController');

// User management routes
router.post('/users', createNewUser);
router.get('/users', listUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);

module.exports = router;