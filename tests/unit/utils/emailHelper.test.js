const nodemailer = require('nodemailer');

const emailHelper = require('../../../utils/emailHelper');

describe('emailHelper', () => {
    describe('sendEmail', () => {
        let sendMail;
        let options;

        beforeEach(() => {
            sendMail = jest.fn();
            nodemailer.createTransport = jest.fn().mockReturnValue({
                sendMail: sendMail
            });

            options = {
                email: 'test@test.com',
                subject: 'Test',
                message: 'Test'
            };
        });

        it('should be a function', () => {
            expect(typeof emailHelper.sendEmail).toBe('function');
        });

        it('should create a transport object', async () => {
            await emailHelper.sendEmail(options);

            expect(nodemailer.createTransport).toHaveBeenCalled();
        });

        it('should send an email with the given options', async () => {
            await emailHelper.sendEmail(options);

            expect(sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: options.email,
                    subject: expect.stringContaining(options.subject),
                    text: expect.stringContaining(options.message)
                })
            );
        });
    });
});