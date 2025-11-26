import express from "express";
import "dotenv/config";
import cors from "cors";
import userAuth from "./routes/userAuth.js";
import sellerAuth from "./routes/sellerAuth.js";
import adminAuth from "./routes/adminAuth.js"
const app  = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;
app.use("/api/auth/user", userAuth);
app.use("/api/auth/seller",sellerAuth)
app.use("/api/auth/admin",adminAuth)

app.listen(port, () => console.log(`Server running on port ${port}`));