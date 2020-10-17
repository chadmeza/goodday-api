const httpMocks = require('node-mocks-http');
const jwt = require('jsonwebtoken');

const authHandler = require('../../../middleware/authHandler');
const User = require('../../../models/User');

describe('authHandler', () => {
    let req, res, next;
    let testUser;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();

        testUser = {
            _id: '1',
            email: 'test@test.com',
            role: 'user',
            isActive: true
        };
    });

    describe('requireAuth', () => {
        let testToken;
        let testPayload;

        beforeEach(() => {
            testToken = 'testToken';
            req.headers.authorization = 'Bearer ' + testToken;

            testPayload = {
                id: '1',
                email: 'test@test.com',
                role: 'user'
            };

            jwt.verify = jest.fn().mockReturnValue(testPayload);
            User.findById = jest.fn().mockReturnValue(testUser);
        });

        it('should be a function', () => {
            expect(typeof authHandler.requireAuth).toBe('function');
        });

        it('should verify an auth token', async () => {
            await authHandler.requireAuth(req, res, next);

            expect(jwt.verify).toHaveBeenCalled();
        });

        it('should verify the token from the authorization header', async () => {
            await authHandler.requireAuth(req, res, next);

            expect(jwt.verify.mock.calls[0][0]).toBe(testToken);
        });

        it('should verify that the token payload references a valid user', async () => {
            await authHandler.requireAuth(req, res, next);

            expect(User.findById).toHaveBeenCalledWith(testPayload.id);
        });

        it('should populate req.user with the user data', async () => {
            await authHandler.requireAuth(req, res, next);

            expect(req.user).toMatchObject(expect.objectContaining({ _id: testUser._id }));
        });

        it('should call next()', async () => {
            await authHandler.requireAuth(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should return a status code of 401 if no auth token is provided', async () => {
            req.headers.authorization = undefined;

            await authHandler.requireAuth(req, res, next);

            expect(res.statusCode).toBe(401);
        });

        it('should return a status code of 401 if the token does not reference a valid user', async () => {
            User.findById.mockReturnValue(null);

            await authHandler.requireAuth(req, res, next);

            expect(res.statusCode).toBe(401);
        });

        it('should return a status code of 401 if the user is not active', async () => {
            User.findById.mockReturnValue({ ...testUser, isActive: false });

            await authHandler.requireAuth(req, res, next);

            expect(res.statusCode).toBe(401);
        });

        it('should pass errors to the error handler', async () => {
            const testError = new Error('Test');
            User.findById.mockRejectedValue(testError);

            await authHandler.requireAuth(req, res, next);

            expect(next).toHaveBeenCalledWith(testError);
        });
    });

    describe('requireAdmin', () => {
        it('should be a function', () => {
            expect(typeof authHandler.requireAdmin).toBe('function');
        });

        it('should call next() if the logged-in user is an admin', () => {
            testUser.role = 'admin';
            req.user = testUser;

            authHandler.requireAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should return a status code of 401 if the logged-in user is not an admin', () => {
            req.user = testUser; 

            authHandler.requireAdmin(req, res, next);

            expect(res.statusCode).toBe(401);
        });

        it('should return a status code of 401 if the user is not logged-in', () => {
            authHandler.requireAdmin(req, res, next);

            expect(res.statusCode).toBe(401);
        });
    });
});