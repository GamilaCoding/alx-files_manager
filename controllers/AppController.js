const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

export function getStatus(_, res) {
  console.log(dbClient);
  res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
}

export async function getStats(_, res) {
  res.status(200).json({
    users: await dbClient.nbUsers(),
    files: await dbClient.nbFiles(),
  });
}
