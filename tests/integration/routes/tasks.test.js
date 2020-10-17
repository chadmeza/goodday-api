const request = require('supertest');
const mongoose = require('mongoose');

const Task = require('../../../models/Task');
const User = require('../../../models/User');
const authHelper = require('../../../utils/authHelper');

describe('/api/v1/tasks', () => {
    let server;
    let tasks;
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
                role: 'user'
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

        tasks = [
            new Task({
                title: 'Test Task 1', 
                user: users[0]._id
            }),
            new Task({
                title: 'Test Task 2', 
                user: users[1]._id
            }),
            new Task({
                title: 'Test Task 3', 
                user: users[0]._id
            })
        ];

        await Task.insertMany(tasks);
    });

    afterEach(async () => {
        await server.close();
        await User.deleteMany({});
        await Task.deleteMany({});
    });

    describe('GET /', () => {
        it('should return a status code of 200 with all the tasks that belong to the logged-in user', async () => {
            const res = await request(server)
                .get('/api/v1/tasks')
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data.some(task => task.title === tasks[0].title)).toBeTruthy();
            expect(res.body.data.some(task => task.title === tasks[1].title)).toBeFalsy();
        });

        it('should return a status code of 401 if the user is not logged-in', async () => {
            const res = await request(server)
                .get('/api/v1/tasks');

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('POST /', () => {
        let task; 

        beforeEach(() => {
            task = {
                title: 'Test Task 4',
                user: users[0]._id
            };
        });

        it('should return a status code of 201 with the new task', async () => {
            const res = await request(server)
                .post('/api/v1/tasks')
                .set('authorization', 'Bearer ' + authToken)
                .send(task);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('title', task.title);
        });

        it('should return a status code of 401 if the user is not logged-in', async () => {
            const res = await request(server)
                .post('/api/v1/tasks')
                .send(task);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 400 if a required field is missing', async () => {
            task.title = undefined;

            const res = await request(server)
                .post('/api/v1/tasks')
                .set('authorization', 'Bearer ' + authToken)
                .send(task);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('GET /:id', () => {
        it('should return a status code of 200 with the task that has the given ID', async () => {
            const res = await request(server)
                .get('/api/v1/tasks/' + tasks[0]._id)
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('title', tasks[0].title);
        });

        it('should return a status code of 401 if the user is not logged-in', async () => {
            const res = await request(server)
                .get('/api/v1/tasks/' + tasks[0]._id);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 404 if a task cannot be found with the given ID', async () => {
            const testId = mongoose.Types.ObjectId();

            const res = await request(server)
                .get('/api/v1/tasks/' + testId)
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 401 if the task does not belong to the logged-in user', async () => {
            const res = await request(server)
                .get('/api/v1/tasks/' + tasks[1]._id)
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 404 if the given ID is not valid', async () => {
            const res = await request(server)
                .get('/api/v1/tasks/1')
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('PUT /:id', () => {
        let updatedTask;

        beforeEach(() => {
            updatedTask = {
                title: 'Test Task 101'
            };
        });

        it('should return a status code of 200 with the updated task', async () => {
            const res = await request(server)
                .put('/api/v1/tasks/' + tasks[0]._id)
                .set('authorization', 'Bearer ' + authToken)
                .send(updatedTask);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('title', updatedTask.title);
        });

        it('should return a status code of 401 if the user is not logged-in', async () => {
            const res = await request(server)
                .put('/api/v1/tasks/' + tasks[0]._id)
                .send(updatedTask);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 404 if a task cannot be found with the given ID', async () => {
            const testId = mongoose.Types.ObjectId();

            const res = await request(server)
                .put('/api/v1/tasks/' + testId)
                .set('authorization', 'Bearer ' + authToken)
                .send(updatedTask);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 401 if the task does not belong to the logged-in user', async () => {
            const res = await request(server)
                .put('/api/v1/tasks/' + tasks[1]._id)
                .set('authorization', 'Bearer ' + authToken)
                .send(updatedTask);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 404 if the given ID is not valid', async () => {
            const res = await request(server)
                .put('/api/v1/tasks/1')
                .set('authorization', 'Bearer ' + authToken)
                .send(updatedTask);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('DELETE /:id', () => {
        it('should return a status code of 200 with the deleted task', async () => {
            const res = await request(server)
                .delete('/api/v1/tasks/' + tasks[0]._id)
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(res.body.data).toHaveProperty('title', tasks[0].title);
        });

        it('should return a status code of 401 if the user is not logged-in', async () => {
            const res = await request(server)
                .delete('/api/v1/tasks/' + tasks[0]._id);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 404 if a task cannot be found with the given ID', async () => {
            const testId = mongoose.Types.ObjectId();

            const res = await request(server)
                .delete('/api/v1/tasks/' + testId)
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 401 if the task does not belong to the logged-in user', async () => {
            const res = await request(server)
                .delete('/api/v1/tasks/' + tasks[1]._id)
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });

        it('should return a status code of 404 if the given ID is not valid', async () => {
            const res = await request(server)
                .delete('/api/v1/tasks/1')
                .set('authorization', 'Bearer ' + authToken);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('error');
        });
    });
});