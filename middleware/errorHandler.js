const errorHandler = (err, req, res, next) => {
    // default to a status code of 500
    let statusCode = 500;

    // default to the given error message
    let message = err.message;

    // if the headers have already been sent
    // pass the error to the default error handler
    if (res.headersSent) {
        next(err);
    }

    // if the error is a Mongoose validation error, return a 400
    if (err.name == 'ValidationError') {
        statusCode = 400;
    }

    // if the error is from an invalid object ID, return a 404
    if (err.name == 'CastError') {
        statusCode = 404;
        message = 'The specified resource could not be found.'
    }

    // if the error is from a duplicate key, return a 400
    if (err.code == 11000) {
        statusCode = 400;
        message = 'Unique values are required.';
    }

    // return with the error message
    res.status(statusCode).json({
        success: false,
        data: {},
        error: message
    });
};

module.exports = errorHandler;