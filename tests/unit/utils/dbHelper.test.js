const mongoose = require('mongoose');

const dbHelper = require('../../../utils/dbHelper');

describe('dbHelper', () => {
    describe('connectToDB', () => {
        beforeEach(() => {
            mongoose.connect = jest.fn();
        });

        it('should be a function', () => {
            expect(typeof dbHelper.connectToDB).toBe('function');
        });

        it('should connect to the DB URI stored in an environment variable', async () => {
            await dbHelper.connectToDB();

            expect(mongoose.connect.mock.calls[0][0]).toBe(process.env.MONGO_DB_URI);
        });

        it('should handle DB error events', async () => {
            mongoose.connection.on = jest.fn();

            await dbHelper.connectToDB();

            expect(mongoose.connection.on.mock.calls[0][0]).toBe('error');
        });

        it('should terminate the process if the initial connection fails', async () => {
            mongoose.connect.mockRejectedValue(new Error('Test'));
            process.exit = jest.fn();

            await dbHelper.connectToDB();

            expect(process.exit).toHaveBeenCalled();
        });
    });
});