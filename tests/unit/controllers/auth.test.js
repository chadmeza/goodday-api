const httpMocks = require('node-mocks-http');

const authController = require('../../../controllers/auth');
const User = require('../../../models/User');
const emailHelper = require('../../../utils/emailHelper');
const authHelper = require('../../../utils/authHelper');

describe('authController', () => {
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
                role: 'admin'
            }),
            new User({
                email: 'test2@test.com',
                password: '123456',
                isActive: false,
                role: 'user'
            }),
            new User({
                email: 'test3@test.com',
                password: '123456',
                isActive: true,
                role: 'user',
                passwordResetToken: 'testToken',
                passwordResetExpiration: Date.now() + (1000 * 60 * 30)
            })
        ];

        testError = new Error('Test');
    });

    describe('login', () => {
        beforeEach(() => {
            User.findOne = jest.fn().mockReturnValue(users[0]);
            authHelper.generateAuthToken = jest.fn().mockReturnValue('1');
            authHelper.comparePasswords = jest.fn().mockReturnValue(true);
        });

        it('should be a function', () => {
            expect(typeof authController.login).toBe('function');
        });

        it('should find a user that contains the given email', async () => {
            req.body.email = users[0].email;

            await authController.login(req, res, next);

            expect(User.findOne.mock.calls[0][0]).toMatchObject({ email: req.body.email });
        });

        it('should verify that the given password is correct', async () => {
            req.body.email = users[0].email;
            req.body.password = '123456';

            await authController.login(req, res, next); 

            expect(authHelper.comparePasswords.mock.calls[0][0]).toBe(req.body.password);
            expect(authHelper.comparePasswords.mock.calls[0][1]).toBe(users[0].password);
        });

        it('should return a token with a status code of 200', async () => {
            await authController.login(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty('data');
            expect(res._getJSONData().data).toHaveProperty('token', '1');
        });

        it('should return a status code of 401 if a user could not be found containing the given email', async () => {
            User.findOne.mockReturnValue(null);

            await authController.login(req, res, next);

            expect(res.statusCode).toBe(401);
            expect(res._getJSONData()).toHaveProperty('error');
        });

        it('should return a status code of 401 if the user is not active', async () => {
            User.findOne.mockReturnValue(users[1]);

            await authController.login(req, res, next);

            expect(res.statusCode).toBe(401);
            expect(res._getJSONData()).toHaveProperty('error');
        });

        it('should return a status code of 401 if the given password is not valid', async () => {
            authHelper.comparePasswords.mockReturnValue(false);

            await authController.login(req, res, next);

            expect(res.statusCode).toBe(401);
            expect(res._getJSONData()).toHaveProperty('error');
        });

        it('should pass errors to the error handler', async () => {
            User.findOne.mockRejectedValue(testError);

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('register', () => {
        beforeEach(() => {
            User.create = jest.fn();

            authHelper.validatePassword = jest.fn().mockReturnValue(true);
        });

        it('should be a function', () => {
            expect(typeof authController.register).toBe('function');
        });

        it('should create a new user with the request body data', async () => {
            req.body.email = users[0].email;
            req.body.password = users[0].password;

            await authController.register(req, res, next);

            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: users[0].email
                })
            );
        });

        it('should hash the given password', async () => {
            req.body.password = users[0].password;

            await authController.register(req, res, next);

            expect(authHelper.hashPassword).toHaveBeenCalledWith(users[0].password);
        });

        it('should return a status code of 200', async () => {
            User.create.mockReturnValue(users[0]);

            await authController.register(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty('success', true);
        });

        it('should return a status code of 400 if the given password is not valid', async () => {
            authHelper.validatePassword.mockReturnValue(false);

            await authController.register(req, res, next);

            expect(res.statusCode).toBe(400);
        });

        it('should pass errors to the error handler', async () => {
            User.create.mockRejectedValue(testError);

            await authController.register(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('forgotPassword', () => {
        let testHash;

        beforeEach(() => {
            User.findOne = jest.fn().mockReturnValue(users[0]);
            emailHelper.sendEmail = jest.fn();

            users[0].save = jest.fn();

            testHash = 'testHash';

            authHelper.generateRandomToken = jest.fn().mockReturnValue(testHash);
        });

        it('should be a function', () => {
            expect(typeof authController.forgotPassword).toBe('function');
        });

        it('should find a user that contains the given email', async () => {
            req.body.email = users[0].email;

            await authController.forgotPassword(req, res, next);

            expect(User.findOne).toHaveBeenCalledWith({ email: users[0].email });
        });

        it('should generate a password reset token', async () => {
            await authController.forgotPassword(req, res, next);

            expect(authHelper.generateRandomToken).toHaveBeenCalled();
        });

        it('should assign a password reset token and expiration to the user', async () => {
            await authController.forgotPassword(req, res, next);

            expect(users[0].passwordResetToken).toBe(testHash);
            expect(users[0].passwordResetExpiration).not.toBeNull();
        });

        it('should save the updated user', async () => {
            await authController.forgotPassword(req, res, next);

            expect(users[0].save).toHaveBeenCalled();
        });

        it('should send an email to the user that contains a password reset link', async () => {
            authHelper.generateRandomToken.mockReturnValue('testToken');

            await authController.forgotPassword(req, res, next);

            expect(emailHelper.sendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: users[0].email,
                    message: expect.stringContaining('testToken')
                })
            );
        });

        it('should return a status code of 200', async () => {
            await authController.forgotPassword(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty('success', true);
        });

        it('should return a status code of 404 if a user could not be found', async () => {
            User.findOne.mockReturnValue(null);

            await authController.forgotPassword(req, res, next);

            expect(res.statusCode).toBe(404);
        });

        it('should return a status code of 401 if the user is not active', async () => {
            User.findOne.mockReturnValue(users[1]);

            await authController.forgotPassword(req, res, next);

            expect(res.statusCode).toBe(401);
        });

        it('should pass errors to the error handler', async () => {
            User.findOne.mockRejectedValue(testError);

            await authController.forgotPassword(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('resetPassword', () => {
        beforeEach(() => {
            User.findOne = jest.fn().mockReturnValue(users[2]);
            
            authHelper.validatePassword = jest.fn().mockReturnValue(true);
            users[2].save = jest.fn();
        });

        it('should be a function', () => {
            expect(typeof authController.resetPassword).toBe('function');
        });

        it('should find a user that contains the given password reset token', async () => {
            req.params.resetToken = 'testToken';

            await authController.resetPassword(req, res, next);

            expect(User.findOne.mock.calls[0][0]).toMatchObject({ passwordResetToken: 'testToken' });
        });

        it('should clear the password reset token and expiration', async () => {
            await authController.resetPassword(req, res, next);

            expect(users[2].passwordResetToken).toBe(undefined);
            expect(users[2].passwordResetExpiration).toBe(undefined);
        });

        it('should update the user with the given password', async () => {
            authHelper.hashPassword.mockReturnValue('testPassword');

            await authController.resetPassword(req, res, next);

            expect(users[2].password).toBe('testPassword');
            expect(users[2].save).toHaveBeenCalled();
        });

        it('should return a status code of 200', async () => {
            await authController.resetPassword(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty('success', true);
        });

        it('should return a status code of 404 if a user could not be found', async () => {
            User.findOne.mockReturnValue(null);

            await authController.resetPassword(req, res, next);

            expect(res.statusCode).toBe(404);
        });

        it('should return a status code of 400 if the given password is not valid', async () => {
            authHelper.validatePassword.mockReturnValue(false);
            
            await authController.resetPassword(req, res, next);

            expect(res.statusCode).toBe(400);
        });

        it('should pass errors to the error handler', async () => {
            User.findOne.mockRejectedValue(testError);

            await authController.resetPassword(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('changePassword', () => {
        beforeEach(() => {
            User.findById = jest.fn().mockReturnValue(users[0]);

            req.user = { _id: '1' };

            users[0].save = jest.fn();

            authHelper.validatePassword = jest.fn().mockReturnValue(true);
        });

        it('should be a function', () => {
            expect(typeof authController.changePassword).toBe('function');
        });

        it('should find the logged-in user', async () => {
            await authController.changePassword(req, res, next);

            expect(User.findById.mock.calls[0][0]).toBe('1');
        });

        it('should update the user with the given password', async () => {
            authHelper.hashPassword.mockReturnValue('testPassword');
            req.body.password = '1234567';

            await authController.changePassword(req, res, next);

            expect(users[0].password).toBe('testPassword');
            expect(users[0].save).toHaveBeenCalled();
        });

        it('should return a status code of 200', async () => {
            await authController.changePassword(req, res, next);

            expect(res.statusCode).toBe(200);
            expect(res._getJSONData()).toHaveProperty('success', true);
        });

        it('should return a status code of 400 if the given password is not valid', async () => {
            authHelper.validatePassword.mockReturnValue(false);
            
            await authController.changePassword(req, res, next);

            expect(res.statusCode).toBe(400);
        });

        it('should pass errors to the error handler', async () => {
            User.findById.mockRejectedValue(testError);

            await authController.changePassword(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });
});