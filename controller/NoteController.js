const Notes = require('../model/Notes');
const Users = require('../model/Users');
const redis = require('../redis');

class NoteController {
    static getNotes = async (req, res) => {
        var ret = {
            status: false
        };

        try {
            if(req.method !== 'GET') {
                throw new Error('Invalid HTTP method!');
            }

            const { usersId } = req.params;
            const { count, length, overwrite } = req.query;
            if(!usersId) {
                throw new Error('Invalid user ID!');
            }

            const user = await Users.findOne({
                where: {
                    id: usersId,
                    active: 1
                },
                attributes: [
                    'id',
                    'firstName',
                    'lastName'
                ]
            });
            if(!user) {
                throw new Error('User not found.');
            }

            // Check if redis contain the query result 
            const cachedNotes = await redis.get(`notes:${usersId}:${count}:${length}`);
            var notes = null;
            if (cachedNotes && overwrite != 1) {
                // Get from redis
                notes = JSON.parse(cachedNotes);
            } else {
                // Perform query
                notes = await user.getNotes({
                    limit: parseInt(length) + 1,
                    offset: (count * length - length)
                });
            }

            if(notes.length > parseInt(length)) {
                ret.loadMore = 1;
                notes.pop();
            }
            
            // Cache the query result for an hour
            await redis.setex(`notes:${usersId}:${count}:${length}`, 3600, JSON.stringify(notes));
            ret.status = true;
            ret.notes = notes;
        } catch (err) {
            ret.error = err.message;
        }
        res.json(ret);
    }

    static createNote = async (req, res) => {
        var ret = {
            status: false
        };

        try {
            if(req.method != 'POST') {
                throw new Error('Invalid HTTP method.');
            }

            if(Object.keys(req.body).length === 0) {
                throw new Error('Empty POST request.');
            }

            const { remarks, type } = req.body;
            if(!type) {
                throw new Error('Note type cannot be empty!');
            }

            if(!remarks) {
                throw new Error('Remarks cannot be empty!');
            }

            const res = await Notes.createNote(type, {
                type: type,
                usersId: req.user.id,
                remarks: remarks,
            }, req.user);
            if(!res.status) {
                throw new Error(res.error);
            }
            ret.status = true;
        } catch (err) {
            ret.error = err.message;
        }
        res.json(ret);
    }

    static updateNote = async (req, res) => {
        var ret = {
            status: false
        };

        try {
            if(req.method != 'PATCH') {
                throw new Error('Invalid HTTP method.');
            }

            if(Object.keys(req.body).length === 0) {
                throw new Error('Empty POST request.');
            }

            const { remarks, type } = req.body;
            const { notesId } = req.params;
            if(!type) {
                throw new Error('Type cannot be empty!');
            }

            if(!remarks) {
                throw new Error('Remarks cannot be empty!');
            }

            if(!notesId) {
                throw new Error('Invalid note ID.');
            }

            const note = await Notes.findOne({
                where: {
                    id: notesId,
                    active: 1
                }
            });
            if(!note) {
                throw new Error('Note not found.');
            }
            note.type = type;
            note.remarks = remarks;
            await note.save({user: req.user});

            ret.status = true;
            ret.note = note;
        } catch (err) {
            ret.error = err.message;
        }
        res.json(ret);
    }

    static deleteNote = async (req, res) => {
        var ret = {
            status: false
        };

        try {
            if(req.method != 'DELETE') {
                throw new Error('Invalid HTTP method.');
            }
            const { notesId } = req.params;
            if(!notesId) {
                throw new Error('Invalid note ID.');
            }

            const note = await Notes.findOne({
                where: {
                    id: notesId
                }
            });
            if(!note) {
                throw new Error('Note not found.');
            }
            note.active = 0;
            await note.save({user: req.user});
            
            ret.status = true;
        } catch (err) {
            ret.error = err.message;
        }
        res.json(ret);
    }
}

module.exports = NoteController;