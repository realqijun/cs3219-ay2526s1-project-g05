import express from 'express';
import bodyParser from 'body-parser';
import { MongoClientInstance } from '../../common_scripts/mongo.js';
import { setupUserCollection } from './setup.js';
import { UserValidator } from './validation.js';

await MongoClientInstance.start();
await setupUserCollection();
const app = express();
app.use(bodyParser.json());

const getUsersCollection = () => MongoClientInstance.db.collection('users');

// Insert user endpoint
app.post('/users', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate user input
        const validation = UserValidator.validateUser({ username, email, password });
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validation.errors
            });
        }

        const usersCollection = getUsersCollection();

        // Check if username/email already exists
        const userExists = await usersCollection.findOne({
            $or: [{ username }, { email }]
        });

        // HTTP response code 409 - conflict
        if (userExists) {
            return res.status(409).json({ error: 'User with this username or email already exists' });
        }

        // Create user with timestamps
        const user = {
            username,
            email,
            // TODO: hash password before storing
            password,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // user id gets added into the user object after insertion
        const result = await usersCollection.insertOne(user);

        res.status(201).json({
            message: 'User created',
            // dont show password
            user: { ...user, password: undefined }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get all users endpoint
app.get('/users', async (req, res) => {
    try {
        const usersCollection = getUsersCollection();
        // SELECT * from users
        const users = await usersCollection.find({}, {
            // exclude params
            projection: { password: 0 }
        }).toArray();

        res.status(200).json({ users, count: users.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user by ID endpoint
app.get('/users/:id', async (req, res) => {
    try {
        const usersCollection = getUsersCollection();
        const { ObjectId } = await import('mongodb');

        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const user = await usersCollection.findOne(
            { _id: new ObjectId(req.params.id) },
            { projection: { password: 0 } }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user by username endpoint
app.get('/users/username/:username', async (req, res) => {
    try {
        const usersCollection = getUsersCollection();
        const user = await usersCollection.findOne(
            { username: req.params.username },
            { projection: { password: 0 } }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Validation endpoint for testing
app.post('/users/validate', (req, res) => {
    try {
        const { username, email, password } = req.body;
        const validation = UserValidator.validateUser({ username, email, password });

        res.status(200).json({
            valid: validation.valid,
            errors: validation.errors,
            details: validation.details
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

process.on('SIGINT', async () => {
    console.log('Shutting down user service...');
    await MongoClientInstance.close();
    process.exit(0);
});

// server start and listen to port 3000 default
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`User service running on port ${PORT}`);
    console.log(`Refers to the database named ${process.env.MONGO_DB_NAME}`);
});