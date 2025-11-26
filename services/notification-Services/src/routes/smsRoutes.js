import express from "express";
import { sendSms } from "../controllers/smsController.js";
const router = express.Router();

router.post("/send", sendSms);
export default router;