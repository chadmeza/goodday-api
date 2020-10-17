const httpMocks = require('node-mocks-http');

const usersController = require('../../../controllers/users');
const User = require('../../../models/User');
const authHelper = require('../../../utils/authHelper');

describe('usersController', () => {
    let req, res, next;
    let users;
    let testError;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();

        authHelper.hashPassword = jest.fn();

        users = [
            new User({
                email: 'test1@test.com',
                password: '123456',
                isActive: true, 
                role: 'user'
            })
        ];

        testError = new Error('Test');
    });

    describe('getUsers', () => {
        beforeEach(() => {
            User.find = jest.fn();
        });

        it('should be a function', () => {
            expect(typeof usersController.getUsers).toBe('function');
        });

        it('should find all users', async () => {
            await usersController.getUsers(req, res, next);

            expect(User.find).toHaveBeenCalledWith({});
        });

        it('should return all users with a status code of 200', async () => {
            User.find.mockReturnValue(users);

            await usersController.getUsers(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty('data');
            expect(res._getJSONData().data.some(user => user.email === users[0].email)).toBeTruthy();
        });

        it('should pass errors to the error handler', async () => {
            User.find.mockRejectedValue(testError);

            await usersController.getUsers(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('createUser', () => {
        beforeEach(() => {
            User.create = jest.fn();

            req.body = users[0];
        });

        it('should be a function', () => {
            expect(typeof usersController.createUser).toBe('function');
        });

        it('should create a new user with the request body data', async () => {
            authHelper.hashPassword.mockReturnValue('testPassword');

            await usersController.createUser(req, res, next);

            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: users[0].email,
                    password: 'testPassword'
                })
            );
        });

        it('should return the new user with a status code of 201', async () => {
            User.create.mockReturnValue(users[0]);

            await usersController.createUser(req, res, next);

            expect(res.statusCode).toBe(201);
            expect(res._getJSONData()).toHaveProperty('data');
            expect(res._getJSONData().data).toHaveProperty('email', users[0].email);
        });

        it('should return a status code of 400 if the given password is not valid', async () => {
            req.body.password = '123';

            await usersController.createUser(req, res, next);

            expect(res.statusCode).toBe(400);
        });

        it('should pass errors to the error handler', async () => {
            User.create.mockRejectedValue(testError);

            await usersController.createUser(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('getUser', () => {
        beforeEach(() => {
            User.findById = jest.fn();
        });

        it('should be a function', () => {
            expect(typeof usersController.getUser).toBe('function');
        });

        it('should find a user that contains the given ID', async () => {
            req.params.id = '1';

            await usersController.getUser(req, res, next);

            expect(User.findById).toHaveBeenCalledWith('1');
        });

        it('should return a user with a status code of 200', async () => {
            User.findById.mockReturnValue(users[0]);

            await usersController.getUser(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty('data');
            expect(res._getJSONData().data).toHaveProperty('email', users[0].email);
        });

        it('should return a status code of 404 if a user cannot be found with the given ID', async () => {
            User.findById.mockReturnValue(null);

            await usersController.getUser(req, res, next);

            expect(res.statusCode).toBe(404);
        });

        it('should pass errors to the error handler', async () => {
            User.findById.mockRejectedValue(testError);

            await usersController.getUser(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('updateUser', () => {
        beforeEach(() => {
            User.findByIdAndUpdate = jest.fn();
        });

        it('should be a function', () => {
            expect(typeof usersController.updateUser).toBe('function');
        });

        it('should hash the password if it is provided', async () => {
            req.body = users[0];

            await usersController.updateUser(req, res, next);

            expect(authHelper.hashPassword).toHaveBeenCalled();
        });

        it('should update the user that contains the given ID', async () => {
            const testUser = {
                email: 'test101@test.com'
            };
            req.params.id = '1';
            req.body = testUser;

            await usersController.updateUser(req, res, next);

            expect(User.findByIdAndUpdate.mock.calls[0][0]).toBe('1');
            expect(User.findByIdAndUpdate.mock.calls[0][1]).toMatchObject(testUser);
        });

        it('should return the updated user with a status code of 200', async () => {
            User.findByIdAndUpdate.mockReturnValue(users[0]);

            await usersController.updateUser(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty('data');
            expect(res._getJSONData().data).toHaveProperty('email', users[0].email);
        });

        it('should return a status code of 404 if a user could not be found with the given ID', async () => {
            User.findByIdAndUpdate.mockReturnValue(null);

            await usersController.updateUser(req, res, next);

            expect(res.statusCode).toBe(404);
        });

        it('should return a status code of 400 if the given password is not valid', async () => {
            req.body.password = '123';

            await usersController.updateUser(req, res, next);

            expect(res.statusCode).toBe(400);
        });

        it('should pass errors to the error handler', async () => {
            User.findByIdAndUpdate.mockRejectedValue(testError);

            await usersController.updateUser(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('deleteUser', () => {
        beforeEach(() => {
            User.findByIdAndDelete = jest.fn();
        });

        it('should be a function', () => {
            expect(typeof usersController.deleteUser).toBe('function');
        });

        it('should delete the user that contains the given ID', async () => {
            req.params.id = '1';

            await usersController.deleteUser(req, res, next);

            expect(User.findByIdAndDelete).toHaveBeenCalledWith('1');
        });

        it('should return the deleted user with a status code of 200', async () => {
            User.findByIdAndDelete.mockReturnValue(users[0]);

            await usersController.deleteUser(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty('data');
            expect(res._getJSONData().data).toHaveProperty('email', users[0].email);
        });

        it('should return a status code of 404 if a user cannot be found with the given ID', async () => {
            User.findByIdAndDelete.mockReturnValue(null);

            await usersController.deleteUser(req, res, next);

            expect(res.statusCode).toBe(404);
        });

        it('should pass errors to the error handler', async () => {
            User.findByIdAndDelete.mockRejectedValue(testError);

            await usersController.deleteUser(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });
});