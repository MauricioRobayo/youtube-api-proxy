import type {HttpFunction} from '@google-cloud/functions-framework/build/src/functions';
import axios from 'axios';
import {MongoClient} from 'mongodb';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

if (!process.env.YOUTUBE_API_KEY) {
  throw new Error('Missing YOUTUBE_API_KEY env var');
}

if (!process.env.MONGODB_URI) {
  throw new Error('Missing MONGODB_URI env var');
}

const mongodbUri = process.env.MONGODB_URI;
const youtubeApiKey = process.env.YOUTUBE_API_KEY;

const client = new MongoClient(mongodbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

export const youtubeAPI: HttpFunction = async (req, res) => {
  const {originalUrl} = req;
  await client.connect();
  const database = client.db('youtube-api-proxy');
  const cache = database.collection('cache');
  const query = {originalUrl};
  const doc = await cache.findOne(query);

  if (doc && doc.cached > Date.now() - 60 * 60 * 1000) {
    res.set('X-Cache-Status', 'HIT');
    res.json(doc.data);
    return;
  }

  try {
    const response = await axios.get(
      `${BASE_URL}${originalUrl}&key=${youtubeApiKey}`
    );
    const update = {
      $set: {
        originalUrl,
        data: response.data,
        cached: Date.now(),
      },
    };
    cache.updateOne(query, update, {upsert: true});
    res.set('X-Cache-Status', 'MISS');
    res.json(response.data);
  } catch (error) {
    console.log(error);
    if (error.response?.status) {
      res.status(error.response.status).json(error);
      return;
    }
    res.status(500).json(error);
  }
};
