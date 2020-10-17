const mongoose = require('mongoose');

const handleDBError = (error) => {
    // terminate the process
    process.exit(1);
};

exports.connectToDB = async () => {
    try {
        // connect to the DB
        await mongoose.connect(process.env.MONGO_DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        });

        // handle error events
        mongoose.connection.on('error', handleDBError);
    } catch(error) {
        handleDBError(error);
    }
};