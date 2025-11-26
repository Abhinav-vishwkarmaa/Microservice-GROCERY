import { sendSMS } from "../service/smsService.js";
export const sendSms = async (req, res) => {
    try {
    const { mobile, otp } = req.body;
    await sendSMS(mobile,otp)
    res.json({ message: "Sms sent successfully" }) 
    } catch (error) {
        res.status(500).json({ message: "Failed to send sms" })
    }
}