import type {HttpFunction} from '@google-cloud/functions-framework/build/src/functions';
import axios from 'axios';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const youtubeAPI: HttpFunction = async (req, res) => {
  if (!process.env.YOUTUBE_API_KEY) {
    console.log('Missing YOUTUBE_API_KEY env var');
    res.status(500).send('Missing YOUTUBE_API_KEY');
    return;
  }

  try {
    const response = await axios.get(
      `${BASE_URL}${req.originalUrl}&key=${process.env.YOUTUBE_API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    console.log(error);
    if (error.response?.status) {
      res.status(error.response.status);
    }
    res.json(error);
  }
};
