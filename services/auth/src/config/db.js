import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();
let pool;

export const connectDB = () => {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: Number(process.env.DB_PORT)
        });

        console.log("MySQL pool created successfully");

        // 🔥 Connection test here
        pool.query("SELECT 1")
            .then(() => console.log("DB Connected Successfully!"))
            .catch(err => console.error("DB Test Failed:", err.message));

        return pool;

    } catch (error) {
        console.error("MySQL Connection Error:", error);
        process.exit(1);
    }
};

export const query = (sql, values) => {
    if (!pool) {
        throw new Error("Database not initialized. Call connectDB() first.");
    }
    return pool.execute(sql, values);
};

export const db = () => {
    if (!pool) {
        throw new Error("Database not initialized. Call connectDB() first.");
    }
    return pool;
};
connectDB();
