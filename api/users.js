const express = require('express');
const router = express.Router();
const userController = require('./controllers/userController');
const validate = require('./middleware/validate');
const { createUserValidation, updateUserValidation } = require('./validations/userValidations');

// User routes
router.get('/users', userController.listUsers);
router.post('/users', validate(createUserValidation), userController.createNewUser);
router.get('/users/:userId', userController.getUserById);
router.put('/users/:userId', validate(updateUserValidation), userController.updateUser);
router.delete('/users/:userId', userController.deleteUser);

// Plan routes
router.get('/plans', userController.getPlanData);

module.exports = router;
