import sha1 from 'sha1';
import { ObjectId } from 'mongodb';

const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

export async function postNew(req, res) {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Missing password' });
  }
  const existingObject = await dbClient.db.collection('users').findOne({ email });
  if (existingObject) {
    return res.status(400).json({ error: 'Already exist' });
  }
  const hashedPassword = sha1(password);

  const insertionResult = await dbClient.db.collection('users').insertOne({
    email,
    password: hashedPassword,
  });

  const { insertedId } = insertionResult;
  res.status(201).json({ _id: insertedId, email });
}

export async function getMe(req, res) {
  const xToken = req.headers['x-token'];
  if (!xToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = await redisClient.get(`auth_${xToken}`);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const user = await dbClient.db.collection('users').findOne({ '_id': ObjectId(userId)})
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({
    id: userId,
    email: user.email,
  });
}
