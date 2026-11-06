
import mongoose from "mongoose";

let connectionPromise;

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI must be configured before using the API.");
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(process.env.MONGODB_URI)
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

export default connectDB;
