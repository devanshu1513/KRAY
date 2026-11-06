// File used to connect website to MongoDB database
import mongoose from "mongoose"; // Mongoose is an ODM (Object Data Modeling) library for MongoDB. MongoDB stores data as JSON-like documents. Mongoose lets you: define schemas, create models, validate data, query DB easily. Without Mongoose, you’d use raw MongoDB driver (more complex)

// async means this function contains asynchronous operations. We can use 'await' inside it
let connectionPromise;

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI must be configured before using the API.");
    }

    if (mongoose.connection.readyState === 1) return mongoose.connection;

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(process.env.MONGO_URI)
            .then(() => {
                console.info("MongoDB connected successfully.");
                return mongoose.connection;
            })
            .catch((error) => {
                connectionPromise = undefined;
                throw error;
            });
    }

    return connectionPromise;
};

export default connectDB; // Exports the function so it can be used elsewhere
