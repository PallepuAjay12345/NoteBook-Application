// Required packages and configurations
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./models/db'); 
const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve index.html on the root endpoint
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/public/Login/index.html");
});

// User registration endpoint
app.post('/register', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match. Please try again.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into the database
        pool.query('INSERT INTO users (name, mail, password) VALUES (?, ?, ?)', [name, email, hashedPassword], (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ error: 'Registration failed. Please try again later.' });
            } else {
                // Create JWT token for user authentication
                const accessToken = jwt.sign({ username: name }, process.env.JWT_SECRET);
                res.json({ accessToken: accessToken });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// User login endpoint
app.post('/login', async (req, res) => {
    const { name, password } = req.body;
    
    try {
        // Query user from database by username
        pool.query('SELECT * FROM users WHERE name = ?', [name], async (error, results) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ error: 'Internal Server Error' });
            } else if (results.length > 0) {
                const user = results[0];
                const passwordMatch = await bcrypt.compare(password, user.password);
                
                if (passwordMatch) {
                    // Create JWT token for user authentication
                    const accessToken = jwt.sign({ username: user.name }, process.env.JWT_SECRET);
                    res.json({ accessToken: accessToken });
                } else {
                    // Incorrect password
                    res.status(401).json({ error: 'Authentication failed. Check your credentials.' });
                }
            } else {
                // User not found
                res.status(404).json({ error: 'User not found' });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Notes CRUD endpoints

// Create a new note
app.post('/notes', (req, res) => {
    const { noteName } = req.body;
    pool.query('INSERT INTO notes (note_title) VALUES (?)', [noteName], (error, result) => {
        if (error) {
            console.error('Error adding note:', error);
            res.status(500).send('Error adding note');
        } else {
            const noteId = result.insertId;
            res.redirect('/Dashboard/home.html'); // Assuming redirect to home after note creation
        }
    });
});

// Get all notes
app.get('/notes', (req, res) => {
    pool.query('SELECT *, CONVERT_TZ(created_at, \'+00:00\', \'+05:30\') AS ist_created_at FROM notes ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('Error fetching notes:', err);
            res.status(500).json({ error: 'Error fetching notes' });
        } else {
            // Map over results to replace created_at with ist_created_at
            const notes = results.map(note => {
                return {
                    ...note,
                    created_at: note.ist_created_at // Replace created_at with IST timestamp
                };
            });
            res.json(notes);
        }
    });
});
// Delete a note by note_id
app.delete('/notes/:note_id', (req, res) => {
    const noteId = req.params.note_id;

    pool.query('DELETE FROM notes WHERE note_id = ?', [noteId], (error, result) => {
        if (error) {
            console.error('Error deleting note:', error);
            res.status(500).json({ error: 'Error deleting note' });
        } else {
            console.log('Note deleted successfully');
            res.status(200).json({ message: 'Note deleted successfully' });
        }
    });
});

// Messages CRUD endpoints

// Add a message to a specific note_id
app.post('/messages/note_id/:note_id', async (req, res) => {
    const noteId = Number(req.params.note_id);
    const { message_content } = req.body;
    
    try {
        pool.query('INSERT INTO messages (note_id, message_content) VALUES (?, ?)', [noteId, message_content], (error, result) => {
            if (error) {
                console.error('Error:', error);
                res.status(500).send('Error');
            } else {
                console.log('Message added successfully');
                res.status(200).send('Message added successfully');
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server error');
    }
});

// Get all messages for a specific note_id
app.get('/messages/note_id/:note_id', (req, res) => {
    const noteId = Number(req.params.note_id);

    const query = 'SELECT *, CONVERT_TZ(sent_at, \'+00:00\', \'+05:30\') AS ist_sent_at FROM messages WHERE note_id = ?';

    pool.query(query, [noteId], (err, results) => {
        if (err) {
            console.error('Error fetching messages:', err);
            return res.status(500).json({ error: 'Error fetching messages' });
        }

        // Map over results to replace sent_at with ist_sent_at
        const messages = results.map(message => {
            return {
                ...message,
                sent_at: message.ist_sent_at // Replace sent_at with IST timestamp
            };
        });

        res.json(messages);
    });
});

// Delete a message by message_id
app.delete('/message/:message_id', (req, res) => {
    const messageId = req.params.message_id;

    pool.query('DELETE FROM messages WHERE message_id = ?', [messageId], (error, result) => {
        if (error) {
            console.error('Error deleting message:', error);
            res.status(500).json({ error: 'Error deleting message' });
        } else {
            console.log('Message deleted successfully');
            res.status(200).json({ message: 'Message deleted successfully' });
        }
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});
