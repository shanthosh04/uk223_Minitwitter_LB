import request from 'supertest';
import express from 'express';
import { TweetController } from './tweets';
import { Database } from '../../database';

// Mock der Datenbank
jest.mock('../../database', () => {
  return {
    Database: jest.fn().mockImplementation(() => ({
      executeSQL: jest.fn().mockImplementation(query => {
        if (query.includes('SELECT tweets.id')) {
          return Promise.resolve([{ id: 1, content: 'Hello World', created_at: new Date(), username: 'testUser', user_role: 'user' }]);
        }
        if (query.includes('INSERT INTO tweets')) {
          return Promise.resolve({ insertId: 1 });
        }
        return Promise.resolve([]); // Standard-Response für andere Fälle
      })
    }))
  };
});

describe('TweetController', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    const tweetController = new TweetController();
    app.use('/tweets', tweetController.router);
  });

  it('sollte alle Tweets abrufen', async () => {
    await request(app)
      .get('/tweets/')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].content).toEqual('Hello World');
      });
  });

  it('sollte einen neuen Tweet erstellen', async () => {
    const tweetData = { content: 'New Tweet!' };
    await request(app)
      .post('/tweets/')
      .send(tweetData)
      .expect(201)
      .then(response => {
        expect(response.body.message).toEqual('Tweet created');
      });
  });

});
