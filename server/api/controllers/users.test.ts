import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Database } from '../../database';
import { UserController } from './users';

// Mock der Datenbank, um bestimmte Anfragen zu simulieren
jest.mock('../../database', () => {
  return {
    Database: jest.fn().mockImplementation(() => ({
      executeSQL: jest.fn().mockImplementation(query => {
        if (query.includes('WHERE username = \'Maria\'') && query.includes('password = \'terster\'')) {
          // Simulieren, dass der Benutzer für Login existiert
          return Promise.resolve([{ id: 50, username: 'Maria', password: 'terster', role: 'user', is_active: true }]);
        } else if (query.includes('SELECT id, username')) {
          // Für `get` eine positive Antwort geben
          return Promise.resolve([{ id: 50, username: 'Maria', role: 'user', is_active: true }]);
        }
        return Promise.resolve([]); // Standard-Response für andere Fälle
      })
    }))
  };
});

describe('UserController', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    const userController = new UserController();
    app.use('/users', userController.router);
    process.env.JWT_SECRET = 'your_secret_here'; // Setzen des Secrets für JWT
  });

  it('sollte einen neuen Benutzer registrieren', async () => {
    const newUser = { username: 'Maria', password: 'terster' };
    await request(app)
      .post('/users/')
      .send(newUser)
      .expect(201) // Überprüfen Sie, ob Ihre Logik 201 zurückgibt, sonst passen Sie den Statuscode an
      .then((response) => {
        expect(response.body.message).toEqual('user created');
      });
  });

  it('sollte einen Benutzer anmelden', async () => {
    const loginData = { username: 'Maria', password: 'terster' };
    await request(app)
      .post('/users/login')
      .send(loginData)
      .expect(200)
      .then((response) => {
        expect(response.body.jwt).toBeDefined();
        expect(response.body.user).toBeDefined();
        expect(response.body.user.id).toEqual(50);
      });
  });

  it('sollte einen Benutzer abrufen', async () => {
    await request(app)
      .get('/users/50')
      .expect(200)
      .then((response) => {
        expect(response.body.id).toEqual(50);
        expect(response.body.username).toEqual('Maria');
      });
  });
});
