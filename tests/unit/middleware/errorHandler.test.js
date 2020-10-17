const httpMocks = require('node-mocks-http');

const errorHandler = require('../../../middleware/errorHandler');

describe('errorHandler', () => {
    let err, req, res, next;

    beforeEach(() => {
        err = {
            message: 'Test'
        };

        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
    });

    it('should be a function', () => {
        expect(typeof errorHandler).toBe('function');
    });

    it('should pass the error to the default error handler if the headers have already been sent', () => {
        res.headersSent = true;

        errorHandler(err, req, res, next);

        expect(next).toHaveBeenCalledWith(err);
    });

    it('should return the error message with a status code of 500', () => {
        errorHandler(err, req, res, next);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toHaveProperty('error', err.message);
    });

    it('should return a status code of 400 if the error is a validation error', () => {
        err.name = 'ValidationError';

        errorHandler(err, req, res, next);

        expect(res.statusCode).toBe(400);
    });

    it('should return a status code of 404 if the error is from an invalid object ID', () => {
        err.name = 'CastError';

        errorHandler(err, req, res, next);

        expect(res.statusCode).toBe(404);
    });

    it('should return a status code of 400 if the error is from a duplicate key', () => {
        err.code = 11000;

        errorHandler(err, req, res, next);

        expect(res.statusCode).toBe(400);
    });
});