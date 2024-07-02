import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';

const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const SECONDS_IN_DAY = 86400;
export async function getConnect(req, res) {
  const { authorization } = req.headers;
  const userCode = authorization.split(' ')[1];
  const bufferObj = Buffer.from(userCode, 'base64');
  const decodedString = bufferObj.toString('utf-8');
  const splittedData = decodedString.split(':');
  const email = splittedData[0];
  const password = splittedData[1];
  const hashedPassword = sha1(password);
  const foundUser = await dbClient.db.collection('users').findOne({
    email,
    password: hashedPassword,
  });
  if (!foundUser) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const myToken = uuidv4();
  const key = `auth_${myToken}`;
  await redisClient.set(key, foundUser._id.toString(), SECONDS_IN_DAY);
  res.status(200).json({ token: myToken });
}

export async function getDisconnect(req, res) {
  const xToken = req.headers['x-token'];
  const foundUser = await redisClient.get(`auth_${xToken}`);
  if (!foundUser) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  await redisClient.del(`auth_${xToken}`);
  res.status(204).send();
}
