import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const ACCEPTED_TYPES = ['folder', 'file', 'image'];
export async function postUpload(req, res) {
  const xToken = req.headers['x-token'];
  if (!xToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = await redisClient.get(`auth_${xToken}`);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const {
    name, type, data, parentId, isPublic,
  } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Missing name' });
  }
  if (!type || !ACCEPTED_TYPES.includes(type)) {
    res.status(400).json({ error: 'Missing type' });
  }
  if (!data && type !== 'folder') {
    res.status(400).json({ error: 'Missing data' });
  }
  if (parentId) {
    const parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
    if (!parentFile) {
      res.status(400).json({ error: 'Parent not found' });
    }
    if (parentFile && parentFile.type !== 'folder') {
      res.status(400).json({ error: 'Parent is not a folder' });
    }
  }
  const dataFiles = {
    userId: user._id,
    type,
    name,
    parentId: parentId || 0,
    isPublic: isPublic || false,
  };
  if (type !== 'folder') {
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

    if (!existsSync(folderPath)) {
      try {
        mkdirSync(folderPath);
      } catch (err) {
        res.status(500).json({ error: 'Failed to make the folder' });
      }
    }

    const fileName = uuidv4();
    const fullPath = folderPath.concat('/', fileName);
    const fileBuffer = Buffer.from(data, 'base64');

    try {
      writeFileSync(fullPath, fileBuffer);
    } catch (err) {
      res.status(500).json({ error: 'Failed to write to the file' });
    }
    dataFiles.localPath = fullPath;
  }

  const insertionResult = await dbClient.db.collection('files').insertOne(dataFiles);
  const { insertedId } = insertionResult;
  const sendObject = {
    id: insertedId,
    userId,
    name,
    type,
    isPublic,
    parentId: parentId || 0,
  };
  return res.status(201).json(sendObject);
}


export async function getShow(req, res) {
  const xToken = req.headers['x-token'];
  if (!xToken) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = await redisClient.get(`auth_${xToken}`);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
  }
  const file = await dbClient.db.collection('files').findOne({
    _id: ObjectId(req.params.id),
    userId: ObjectId(userId),
  });
  if (!file) {
    return res.status(404).json({ error: 'Not found' });
  }
  return res.status(200).json(file);
}

export async function getIndex(req, res) {
  const xToken = req.headers['x-token'];
  if (!xToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${xToken}`);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { parentId = '0', page = 0 } = req.query;
  const pageSize = 20;
  const skip = page * pageSize;

  const queryFilesResult = await dbClient.db.collection('files')
    .find({
      parentId: parentId === '0' ? '0' : ObjectId(parentId),
      userId: ObjectId(userId),
    })
    .skip(skip)
    .limit(pageSize)
    .toArray();

  return res.status(200).json(queryFilesResult);
}

export async function putPublish(req, res) {
  const xToken = req.headers['x-token'];
  if (!xToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${xToken}`);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const updateResult = await dbClient.db.collection('files').findOneAndUpdate({
    _id: ObjectId(req.params.id),
    userId: ObjectId(userId),
  }, {$set: { isPublic: true }});
  if (!updateResult.value) {
    return res.status(404).json({ error: 'Not found' });
  }
  const file = {
    id: updateResult.value._id,
    userId: updateResult.value.userId,
    name: updateResult.value.name,
    type: updateResult.value.type,
    'isPublic': updateResult.value.isPublic,
    parentId: updateResult.value.parentId
  };
  return res.status(200).json(file);
}

export async function putUnpublish(req, res) {
  const xToken = req.headers['x-token'];
  if (!xToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redisClient.get(`auth_${xToken}`);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const updateResult = await dbClient.db.collection('files').findOneAndUpdate({
    _id: ObjectId(req.params.id),
    userId: ObjectId(userId),
  }, { $set: { isPublic: false } });
  if (!updateResult.value) {
    return res.status(404).json({ error: 'Not found' });
  }
  const file = {
    id: updateResult.value._id,
    userId: updateResult.value.userId,
    name: updateResult.value.name,
    type: updateResult.value.type,
    'isPublic': updateResult.value.isPublic,
    parentId: updateResult.value.parentId
  };
  return res.status(200).json(file);
}
// 088f7184-6ef5-41d7-b890-9f567fb7c0fd"
// curl -XGET 0.0.0.0:5000/files/6685907738775618b2ef9aac -H "X-Token: 088f7184-6ef5-41d7-b890-9f567fb7c0fd" ; echo ""
