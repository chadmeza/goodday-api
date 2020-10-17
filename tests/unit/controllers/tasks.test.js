const httpMocks = require('node-mocks-http');

const tasksController = require('../../../controllers/tasks');
const Task = require('../../../models/Task');

describe('tasksController', () => {
    let req, res, next;
    let tasks;
    let testError;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();

        Task.findById = jest.fn();

        tasks = [
            {
                title: 'Test Task 1',
                user: '1'
            },
            {
                title: 'Test Task 2',
                user: '1'
            },
            {
                title: 'Test Task 3',
                user: '2'
            }
        ];

        req.user = { _id: tasks[0].user };

        testError = new Error('Test');
    });

    describe('getTasks', () => {
        beforeEach(() => {
            Task.find = jest.fn();
        });

        it('should be a function', () => {
            expect(typeof tasksController.getTasks).toBe('function');
        });

        it('should find all tasks for the logged-in user', async () => {
            Task.find.mockReturnValue(tasks);

            await tasksController.getTasks(req, res, next);

            expect(Task.find).toHaveBeenCalledWith({ user: tasks[0].user });
        });

        it('should return any found tasks with a status code of 200', async () => {
            Task.find.mockReturnValue(tasks);

            await tasksController.getTasks(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty('data');
            expect(res._getJSONData().data.length).toBe(tasks.length);
            expect(res._getJSONData().data.some(task => task.title === tasks[0].title)).toBeTruthy();
        });

        it('should pass errors to the error handler', async () => {
            Task.find.mockRejectedValue(testError);

            await tasksController.getTasks(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('createTask', () => {
        beforeEach(() => {
            Task.create = jest.fn();
        });

        it('should be a function', () => {
            expect(typeof tasksController.createTask).toBe('function');
        });

        it('should create a task with the request body data', async () => {
            req.body = tasks[0];

            await tasksController.createTask(req, res, next);

            expect(Task.create).toHaveBeenCalledWith(tasks[0]);
        });

        it('should return the new task with a status code of 201', async () => {
            Task.create.mockReturnValue(tasks[0]);

            await tasksController.createTask(req, res, next);

            expect(res.statusCode).toBe(201);
            expect(res._getJSONData()).toHaveProperty('data');
            expect(res._getJSONData().data).toHaveProperty('title', tasks[0].title);
        });

        it('should pass errors to the error handler', async () => {
            Task.create.mockRejectedValue(testError);

            await tasksController.createTask(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('getTask', () => {
        it('should be a function', () => {
            expect(typeof tasksController.getTask).toBe('function');
        });

        it('should find a task that contains the given ID', async () => {
            const testId = '1';
            req.params.id = testId;

            await tasksController.getTask(req, res, next);

            expect(Task.findById).toHaveBeenCalledWith(testId);
        });

        it('should return a task with the status code of 200', async () => {
            Task.findById.mockReturnValue(tasks[0]);

            await tasksController.getTask(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty('data');
            expect(res._getJSONData().data).toHaveProperty('title', tasks[0].title);
        });

        it('should return a status code of 404 if a task cannot be found with the given ID', async () => {
            Task.findById.mockReturnValue(null);

            await tasksController.getTask(req, res, next);

            expect(res.statusCode).toBe(404);
        });

        it('should return a status code of 401 if the task does not belong to the logged-in user', async () => {
            Task.findById.mockReturnValue(tasks[2]);

            await tasksController.getTask(req, res, next);

            expect(res.statusCode).toBe(401);
        });

        it('should pass errors to the error handler', async () => {
            Task.findById.mockRejectedValue(testError);

            await tasksController.getTask(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('updateTask', () => {
        beforeEach(() => {
            Task.findByIdAndUpdate = jest.fn();
        });

        it('should be a function', () => {
            expect(typeof tasksController.updateTask).toBe('function');
        });

        it('should update the task that contains the given ID', async () => {
            Task.findById.mockReturnValue(tasks[0]);
            const testId = '1';
            req.params.id = testId;
            req.body.title = 'Test Task 101';

            await tasksController.updateTask(req, res, next);

            expect(Task.findByIdAndUpdate.mock.calls[0][0]).toBe(testId);
            expect(Task.findByIdAndUpdate.mock.calls[0][1]).toHaveProperty('title', req.body.title);
        });

        it('should return the updated task with a status code of 200', async () => {
            Task.findById.mockReturnValue(tasks[0]);
            Task.findByIdAndUpdate.mockReturnValue(tasks[0]);

            await tasksController.updateTask(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty('data');
            expect(res._getJSONData().data).toHaveProperty('title', tasks[0].title);
        });

        it('should return a status code of 404 if a task cannot be found with the given ID', async () => {
            Task.findById.mockReturnValue(null);

            await tasksController.updateTask(req, res, next);

            expect(res.statusCode).toBe(404);
        });

        it('should return a status code of 401 if the task does not belong to the logged-in user', async () => {
            Task.findById.mockReturnValue(tasks[2]);

            await tasksController.updateTask(req, res, next);

            expect(res.statusCode).toBe(401);
        });

        it('should pass errors to the error handler', async () => {
            Task.findById.mockRejectedValue(testError);

            await tasksController.updateTask(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('deleteTask', () => {
        beforeEach(() => {
            Task.findByIdAndDelete = jest.fn();
        });

        it('should be a function', () => {
            expect(typeof tasksController.deleteTask).toBe('function');
        });

        it('should delete the task that contains the given ID', async () => {
            Task.findById.mockReturnValue(tasks[0]);
            const testId = '1';
            req.params.id = testId;

            await tasksController.deleteTask(req, res, next);

            expect(Task.findByIdAndDelete.mock.calls[0][0]).toBe(testId);
        }); 

        it('should return the deleted task with a status code of 200', async () => {
            Task.findById.mockReturnValue(tasks[0]);
            Task.findByIdAndDelete.mockReturnValue(tasks[0]);

            await tasksController.deleteTask(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty('data');
            expect(res._getJSONData().data).toHaveProperty('title', tasks[0].title);
        });

        it('should return a status code of 404 if a task cannot be found with the given ID', async () => {
            Task.findById.mockReturnValue(null);

            await tasksController.deleteTask(req, res, next);

            expect(res.statusCode).toBe(404);
        });

        it('should return a status code of 401 if the task does not belong to the logged-in user', async () => {
            Task.findById.mockReturnValue(tasks[2]);

            await tasksController.deleteTask(req, res, next);

            expect(res.statusCode).toBe(401);
        });

        it('should pass errors to the error handler', async () => {
            Task.findById.mockRejectedValue(testError);

            await tasksController.deleteTask(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });
});