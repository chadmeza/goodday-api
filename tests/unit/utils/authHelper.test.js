const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const authHelper = require('../../../utils/authHelper');

describe('authHelper', () => {
    describe('comparePasswords', () => {
        let testPassword1, testPassword2;

        beforeEach(() => {
            bcrypt.compare = jest.fn().mockReturnValue(true);
            testPassword1 = '123456';
            testPassword2 = '1234567';
        });

        it('should be a function', () => {
            expect(typeof authHelper.comparePasswords).toBe('function');
        });

        it('should compare the given passwords', async () => {
            await authHelper.comparePasswords(testPassword1, testPassword2);

            expect(bcrypt.compare.mock.calls[0][0]).toBe(testPassword1);
            expect(bcrypt.compare.mock.calls[0][1]).toBe(testPassword2);
        });

        it('should return the result of the comparison', async () => {
            const isMatch = await authHelper.comparePasswords(testPassword1, testPassword1);

            expect(isMatch).toBeTruthy();
        });
    });

    describe('generateAuthToken', () => {
        let userId, userEmail, userRole;

        beforeEach(() => {
            jwt.sign = jest.fn().mockReturnValue('testToken');
            userId = '1';
            userEmail = 'test@test.com';
            userRole = 'user';
        });

        it('should be a function', () => {
            expect(typeof authHelper.generateAuthToken).toBe('function');
        });

        it('should create a JWT token with the given user data', () => {
            authHelper.generateAuthToken(userId, userEmail, userRole);

            expect(jwt.sign.mock.calls[0][0]).toMatchObject({
                id: userId,
                email: userEmail,
                role: userRole
            });
        });

        it('should set an expiration on the JWT token', () => {
            authHelper.generateAuthToken(userId, userEmail, userRole);

            expect(jwt.sign.mock.calls[0][2]).toMatchObject({
                expiresIn: process.env.JWT_EXPIRATION
            });
        });

        it('should return the JWT token', () => {
            const token = authHelper.generateAuthToken(userId, userEmail, userRole);

            expect(token).toBe('testToken');
        });
    });

    describe('hashPassword', () => {
        let testPassword;

        beforeEach(() => {
            bcrypt.genSalt = jest.fn();
            bcrypt.hash = jest.fn();
            testPassword = '123456';
        });

        it('should be a function', () => {
            expect(typeof authHelper.hashPassword).toBe('function');
        });

        it('should generate a salt for the hash', async () => {
            await authHelper.hashPassword(testPassword);

            expect(bcrypt.genSalt).toHaveBeenCalled();
        });

        it('should hash the given password', async () => {
            await authHelper.hashPassword(testPassword);

            expect(bcrypt.hash).toHaveBeenCalled();
            expect(bcrypt.hash.mock.calls[0][0]).toBe(testPassword);
        });

        it('should return the hash', async () => {
            bcrypt.hash.mockReturnValue('testHash');

            const hash = await authHelper.hashPassword(testPassword);

            expect(hash).toBe('testHash');
        });
    });

    describe('validatePassword', () => {
        it('should be a function', () => {
            expect(typeof authHelper.validatePassword).toBe('function');
        });

        it('should return true if the given password meets the minimum length requirement', () => {
            const isValid = authHelper.validatePassword('123456');

            expect(isValid).toBeTruthy();
        });

        it('should return false if the given password does not meet the minimum length requirement', () => {
            const isValid = authHelper.validatePassword('123');

            expect(isValid).toBeFalsy();
        });
    });

    describe('generateRandomToken', () => {
        beforeEach(() => {
            crypto.randomBytes = jest.fn().mockReturnValue(Buffer.alloc(1));
        });

        it('should be a function', () => {
            expect(typeof authHelper.generateRandomToken).toBe('function');
        });

        it('should generate random data', () => {
            authHelper.generateRandomToken();

            expect(crypto.randomBytes).toHaveBeenCalled();
        });

        it('should return the token as a string', () => {
            const token = authHelper.generateRandomToken();

            expect(typeof token).toBe('string');
        });
    });
});