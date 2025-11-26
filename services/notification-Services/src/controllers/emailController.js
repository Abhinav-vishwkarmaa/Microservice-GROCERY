import {sendEmailOtpVerification} from "../service/emailService.js";
export const sendEmail = async (req, res) => {
    try {
        const {email,email_otp} = req.body;
        if(!email || !email_otp){
            return res.status(400).json({message:"Email or email_otp is missing"})
        }
        await sendEmailOtpVerification(email,email_otp)
        res.json({ message: "Email sent successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({message:error.message})
    }
}