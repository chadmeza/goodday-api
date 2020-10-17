const request = require('supertest');
const mongoose = require('mongoose');

const User = require('../../../models/User');
const authHelper = require('../../../utils/authHelper');

describe('/api/v1/auth', () => {
    let server;
    let users;
    let testUser;

    beforeEach(async () => {
        server = require('../../../index');

        const password = await authHelper.hashPassword('123456');

        users = [
            new User({
                email: 'test1@test.com',
                password: password,
                isActive: true,
                role: 'user'
            }),
            new User({
                email: 'test2@test.com',
                password: password,
                isActive: false,
                role: 'user'
            })
        ];

        testUser = {
            email: users[0].email,
            password: '123456'
        };

        await User.insertMany(users);
    });

    afterEach(async () => {
        await server.close();
        await User.deleteMany({});
    });

    describe('POST /login', () => {
        it('should return a status code of 200 with an authorization token', async () => {
            const res = await request(server)
                .post('/api/v1/auth/login')
                .send(testUser);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('token');
        });

        it('should return a status code of 401 if a user cannot be found with the given email', async () => {
            testUser.email = 'notfound@test.com';

            const res = await request(server)
                .post('/api/v1/auth/login')
                .send(testUser);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 401 if the user is not active', async () => {
            testUser.email = users[1].email;

            const res = await request(server)
                .post('/api/v1/auth/login')
                .send(testUser);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 401 if the password is not correct', async () => {
            testUser.password = '1234567';

            const res = await request(server)
                .post('/api/v1/auth/login')
                .send(testUser);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('POST /register', () => {
        beforeEach(() => {
            testUser.email = 'test4@test.com';
        });

        it('should return a status code of 200 if successful', async () => {
            const res = await request(server)
                .post('/api/v1/auth/register')
                .send(testUser);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });

        it('should return a status code of 400 if the given password is not valid', async () => {
            testUser.password = '123';

            const res = await request(server)
                .post('/api/v1/auth/register')
                .send(testUser);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 400 if a user with the given email already exists', async () => {
            testUser.email = users[0].email;

            const res = await request(server)
                .post('/api/v1/auth/register')
                .send(testUser);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('POST /forgotpassword', () => {
        it('should return a status code of 200 if successful', async () => {
            const res = await request(server)
                .post('/api/v1/auth/forgotpassword')
                .send({ email: testUser.email });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });

        it('should return a status code of 404 if a user cannot be found with the given email', async () => {
            const res = await request(server)
                .post('/api/v1/auth/forgotpassword')
                .send({ email: 'notfound@test.com' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 401 if the user is not active', async () => {
            const res = await request(server)
                .post('/api/v1/auth/forgotpassword')
                .send({ email: users[1].email });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('PUT /resetpassword/:resetToken', () => {
        let resetToken;

        beforeEach(async () => {
            resetToken = authHelper.generateRandomToken();

            users[1].passwordResetToken = resetToken;
            users[1].passwordResetExpiration = Date.now() + (1000 * 60 * 10);

            await users[1].save();
        });

        it('should return a status code of 200 if successful', async () => {
            const res = await request(server)
                .put('/api/v1/auth/resetpassword/' + resetToken)
                .send({ password: testUser.password });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });

        it('should return a status code of 404 if the password reset token is ivalid or expired', async () => {
            const res = await request(server)
                .put('/api/v1/auth/resetpassword/1')
                .send({ password: testUser.password });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 400 if the new password is not valid', async () => {
            const res = await request(server)
                .put('/api/v1/auth/resetpassword/' + resetToken)
                .send({ password: '123' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('PUT /changepassword', () => {
        let authToken;

        beforeEach(() => {
            authToken = authHelper.generateAuthToken(users[0]._id, users[0].email, users[0].role);
        });

        it('should return a status code of 200 if successful', async () => {
            const res = await request(server)
                .put('/api/v1/auth/changepassword')
                .set('authorization', 'Bearer ' + authToken)
                .send({ password: testUser.password });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });

        it('should return a status code of 401 if the user is not logged-in', async () => {
            const res = await request(server)
                .put('/api/v1/auth/changepassword')
                .send({ password: testUser.password });

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 400 if the given password is not valid', async () => {
            const res = await request(server)
                .put('/api/v1/auth/changepassword')
                .set('authorization', 'Bearer ' + authToken)
                .send({ password: '123' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });
});