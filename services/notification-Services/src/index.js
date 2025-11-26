import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import smsRoutes from "./routes/smsRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/sms", smsRoutes);
app.use("/api/email", emailRoutes);
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
