// // src/model/data/aws/index.js
// const MemoryDB = require('../memory/memory-db');
// const logger = require('../../../logger');

// const s3Client = require('./s3Client');

// const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// // We keep metadata in MemoryDB for now (DynamoDB comes later)
// const metadata = new MemoryDB();

// // Helper: stream -> Buffer
// const streamToBuffer = (stream) =>
//   new Promise((resolve, reject) => {
//     const chunks = [];
//     stream.on('data', (chunk) => chunks.push(chunk));
//     stream.on('error', reject);
//     stream.on('end', () => resolve(Buffer.concat(chunks)));
//   });

// // ---- Metadata ----
// function writeFragment(fragment) {
//   const serialized = JSON.stringify(fragment);
//   return metadata.put(fragment.ownerId, fragment.id, serialized);
// }

// async function readFragment(ownerId, id) {
//   const serialized = await metadata.get(ownerId, id);
//   return typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
// }

// async function listFragments(ownerId, expand = false) {
//   const frags = await metadata.query(ownerId);
//   const parsed = frags.map((f) => JSON.parse(f));

//   if (expand || !frags) return parsed;
//   return parsed.map((f) => f.id);
// }

// // ---- Data (S3) ----
// async function writeFragmentData(ownerId, id, data) {
//   const params = {
//     Bucket: process.env.AWS_S3_BUCKET_NAME,
//     Key: `${ownerId}/${id}`,
//     Body: data,
//   };

//   try {
//     await s3Client.send(new PutObjectCommand(params));
//   } catch (err) {
//     const { Bucket, Key } = params;
//     logger.error({ err, Bucket, Key }, 'Error uploading fragment data to S3');
//     throw new Error('unable to upload fragment data');
//   }
// }

// async function readFragmentData(ownerId, id) {
//   const params = {
//     Bucket: process.env.AWS_S3_BUCKET_NAME,
//     Key: `${ownerId}/${id}`,
//   };

//   try {
//     const data = await s3Client.send(new GetObjectCommand(params));
//     return streamToBuffer(data.Body);
//   } catch (err) {
//     const { Bucket, Key } = params;
//     logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
//     throw new Error('unable to read fragment data');
//   }
// }

// // ---- Delete: metadata (MemoryDB) + data (S3) ----
// async function deleteFragment(ownerId, id) {
//   // Try metadata delete, but don’t fail if missing
//   try {
//     await metadata.del(ownerId, id);
//   } catch (e) {
//     logger?.debug?.({ e, ownerId, id }, 'Metadata missing during delete (ok)');
//   }

//   const params = { Bucket: process.env.AWS_S3_BUCKET_NAME, Key: `${ownerId}/${id}` };
//   try {
//     await s3Client.send(new DeleteObjectCommand(params));
//   } catch (err) {
//     const { Bucket, Key } = params;
//     logger.error({ err, Bucket, Key }, 'Error deleting fragment data from S3');
//     // don’t throw to keep DELETE idempotent
//   }
// }

// module.exports = {
//   listFragments,
//   writeFragment,
//   readFragment,
//   writeFragmentData,
//   readFragmentData,
//   deleteFragment,
// };

// src/model/data/aws/index.js
const logger = require('../../../logger');

// S3 (for fragment DATA)
const s3Client = require('./s3Client');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// DynamoDB (for fragment METADATA)
const ddbDocClient = require('./ddbDocClient');
const { PutCommand, GetCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE = process.env.AWS_DYNAMODB_TABLE_NAME || 'fragments';

// Helper: stream -> Buffer
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

/* ---------------- Metadata (DynamoDB) ---------------- */

function writeFragment(fragment) {
  const params = { TableName: TABLE, Item: fragment };
  return ddbDocClient.send(new PutCommand(params));
}

async function readFragment(ownerId, id) {
  const params = { TableName: TABLE, Key: { ownerId, id } };
  const out = await ddbDocClient.send(new GetCommand(params));
  return out?.Item;
}

async function listFragments(ownerId, expand = false) {
  const params = {
    TableName: TABLE,
    KeyConditionExpression: 'ownerId = :o',
    ExpressionAttributeValues: { ':o': ownerId },
  };
  if (!expand) params.ProjectionExpression = 'id';

  const out = await ddbDocClient.send(new QueryCommand(params));
  const items = out?.Items || [];
  return expand ? items : items.map((i) => i.id);
}

/* ---------------- Data (S3) ---------------- */

async function writeFragmentData(ownerId, id, data) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
    Body: data,
  };
  try {
    await s3Client.send(new PutObjectCommand(params));
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error uploading fragment data to S3');
    throw new Error('unable to upload fragment data');
  }
}

async function readFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };
  try {
    const data = await s3Client.send(new GetObjectCommand(params));
    return streamToBuffer(data.Body);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

/* ---------------- Delete (S3 + DDB) ---------------- */

async function deleteFragment(ownerId, id) {
  // delete S3 object (idempotent)
  const s3Params = { Bucket: process.env.AWS_S3_BUCKET_NAME, Key: `${ownerId}/${id}` };
  try {
    await s3Client.send(new DeleteObjectCommand(s3Params));
  } catch (err) {
    const { Bucket, Key } = s3Params;
    logger.warn({ err, Bucket, Key }, 'Delete S3 failed (continuing)');
  }

  // delete DynamoDB item (idempotent)
  const ddbParams = { TableName: TABLE, Key: { ownerId, id } };
  try {
    await ddbDocClient.send(new DeleteCommand(ddbParams));
  } catch (err) {
    logger.warn({ err, ownerId, id }, 'Delete DDB failed (continuing)');
  }
}

module.exports = {
  listFragments,
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
};
