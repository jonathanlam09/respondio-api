const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/auth');
const UserController = require('../controller/UserController');
const NoteController = require('../controller/NoteController');

router.use(requireAuth);
router.get('/me', UserController.refreshAccess);
router.post('/users/register', UserController.registerUser);
router.post('/users/login', UserController.loginUser);

router.get('/users/:usersId/notes', NoteController.getNotes);
router.post('/users/:usersId/notes', NoteController.createNote);
router.patch('/users/:usersId/notes/:notesId', NoteController.updateNote);
router.delete('/users/:usersId/notes/:notesId', NoteController.deleteNote);

module.exports = router;