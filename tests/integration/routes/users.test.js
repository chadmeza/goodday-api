const request = require('supertest');
const mongoose = require('mongoose');

const User = require('../../../models/User');
const authHelper = require('../../../utils/authHelper');

describe('/api/v1/users', () => {
    let server;
    let users;
    let authToken;

    beforeEach(async () => {
        server = require('../../../index');

        const password = await authHelper.hashPassword('123456');

        users = [
            new User({
                email: 'test1@test.com',
                password: password,
                isActive: true,
                role: 'admin'
            }),
            new User({
                email: 'test2@test.com',
                password: password,
                isActive: true,
                role: 'user'
            })
        ];

        await User.insertMany(users);

        authToken = authHelper.generateAuthToken(users[0]._id, users[0].email, users[0].role);
    });

    afterEach(async () => {
        await server.close();
        await User.deleteMany({});
    });
    
    describe('GET /', () => {
        it('should return a status code of 200 with all of the users in the DB', async () => {
            const res = await request(server)
                .get('/api/v1/users')
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data.some(user => user.email === users[1].email)).toBeTruthy();
            expect(res.body.data.length).toBe(users.length);
        });

        it('should return a status code of 401 if the user is not logged-in', async () => {
            const res = await request(server)
                .get('/api/v1/users');
            
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 401 if the logged-in user is not an admin', async () => {
            authToken = authHelper.generateAuthToken(users[1]._id, users[1].email, users[1].role);

            const res = await request(server)
                .get('/api/v1/users')
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('POST /', () => {
        let newUser;

        beforeEach(() => {
            newUser = {
                email: 'test4@test.com',
                password: '123456',
                isActive: true,
                role: 'user'
            };
        });

        it('should return a status code of 201 with the new user', async () => {
            const res = await request(server)
                .post('/api/v1/users')
                .set('authorization', 'Bearer ' + authToken)
                .send(newUser);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('email', newUser.email);
        });

        it('should return a status code of 401 if the user is not logged-in', async () => {
            const res = await request(server)
                .post('/api/v1/users')
                .send(newUser);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 401 if the logged-in user is not an admin', async () => {
            authToken = authHelper.generateAuthToken(users[1]._id, users[1].email, users[1].role);

            const res = await request(server)
                .post('/api/v1/users')
                .set('authorization', 'Bearer ' + authToken)
                .send(newUser);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 400 if a user with the given email already exists', async () => {
            newUser.email = users[0].email;

            const res = await request(server)
                .post('/api/v1/users')
                .set('authorization', 'Bearer ' + authToken)
                .send(newUser);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 400 if the given password is not valid', async () => {
            newUser.password = '123';

            const res = await request(server)
                .post('/api/v1/users')
                .set('authorization', 'Bearer ' + authToken)
                .send(newUser);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('GET /:id', () => {
        it('should return a status code of 200 with the user that has the given ID', async () => {
            const res = await request(server)
                .get('/api/v1/users/' + users[0]._id)
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('email', users[0].email);
        });

        it('should return a status code of 401 if the user is not logged-in', async () => {
            const res = await request(server)
                .get('/api/v1/users/' + users[0]._id);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 401 if the logged-in user is not an admin', async () => {
            authToken = authHelper.generateAuthToken(users[1]._id, users[1].email, users[1].role);

            const res = await request(server)
                .get('/api/v1/users/' + users[0]._id)
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 404 if a user cannot be found with the given ID', async () => {
            const testId = mongoose.Types.ObjectId();

            const res = await request(server)
                .get('/api/v1/users/' + testId)
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 404 if the given ID is not valid', async () => {
            const res = await request(server)
                .get('/api/v1/users/1')
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('PUT /:id', () => {
        let updatedUser;

        beforeEach(() => {
            updatedUser = {
                email: 'update@test.com', 
                password: '1234567'
            };
        });

        it('should return a status code of 200 with the updated user', async () => {
            const res = await request(server)
                .put('/api/v1/users/' + users[0]._id)
                .set('authorization', 'Bearer ' + authToken)
                .send(updatedUser);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('email', updatedUser.email);
        });

        it('should return a status code of 401 if the user is not logged-in', async () => {
            const res = await request(server)
                .put('/api/v1/users/' + users[0]._id)
                .send(updatedUser);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 401 if the logged-in user is not an admin', async () => {
            authToken = authHelper.generateAuthToken(users[1]._id, users[1].email, users[1].role);

            const res = await request(server)
                .put('/api/v1/users/' + users[0]._id)
                .set('authorization', 'Bearer ' + authToken)
                .send(updatedUser);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 404 if user cannot be found with the given ID', async () => {
            const testId = mongoose.Types.ObjectId();

            const res = await request(server)
                .put('/api/v1/users/' + testId)
                .set('authorization', 'Bearer ' + authToken)
                .send(updatedUser);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 404 if the given ID is not valid', async () => {
            const res = await request(server)
                .put('/api/v1/users/1')
                .set('authorization', 'Bearer ' + authToken)
                .send(updatedUser);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 400 if user with the given email already exists', async () => {
            updatedUser.email = users[0].email;

            const res = await request(server)
                .put('/api/v1/users/' + users[1]._id)
                .set('authorization', 'Bearer ' + authToken)
                .send(updatedUser);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 400 if the given password is not valid', async () => {
            updatedUser.password = '123';

            const res = await request(server)
                .put('/api/v1/users/' + users[1]._id)
                .set('authorization', 'Bearer ' + authToken)
                .send(updatedUser);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('DELETE /:id', () => {
        it('should return a status code of 200 with the deleted user', async () => {
            const res = await request(server)
                .delete('/api/v1/users/' + users[1]._id)
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('email', users[1].email);
        });

        it('should return a status code of 401 if the user is not logged-in', async () => {
            const res = await request(server)
                .delete('/api/v1/users/' + users[1]._id);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 401 if the logged-in user is not an admin', async () => {
            authToken = authHelper.generateAuthToken(users[1]._id, users[1].email, users[1].role);
            
            const res = await request(server)
                .delete('/api/v1/users/' + users[1]._id)
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 404 if a user cannot be found with the given ID', async () => {
            const testId = mongoose.Types.ObjectId();

            const res = await request(server)
                .delete('/api/v1/users/' + testId)
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 404 if the given ID is not valid', async () => {
            const res = await request(server)
                .delete('/api/v1/users/1')
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });
});