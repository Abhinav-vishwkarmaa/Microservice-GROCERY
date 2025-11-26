import "dotenv/config"
import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // 465 = secure
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const htmlForOtpVerification = (email_otp) => `
<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OTP Verification</title>
</head>

<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" 
                style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

                    <!-- Header -->
                    <tr>
                        <td style="background:#ff6f00;padding:20px 0;text-align:center;color:#ffffff;">
                            <h1 style="margin:0;font-size:28px;">ILB Mart</h1>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding:30px 40px;">
                            <h2 style="margin:0;margin-bottom:10px;color:#333;font-size:22px;">
                                Your OTP Verification Code
                            </h2>

                            <p style="font-size:16px;color:#555;line-height:1.6;">
                                Thank you for choosing <strong>ILB Mart</strong>.<br>
                                Please use the OTP below to complete your verification.
                            </p>

                            <div style="text-align:center;margin:25px 0;">
                                <div style="
                                    display:inline-block;
                                    padding:15px 30px;
                                    background:#ff6f00;
                                    color:#ffffff;
                                    font-size:32px;
                                    font-weight:bold;
                                    border-radius:8px;
                                    letter-spacing:5px;
                                ">
                                    ${email_otp}
                                </div>
                            </div>

                            <p style="font-size:15px;color:#777;">
                                This OTP is valid for the next 10 minutes.  
                                Do not share this code with anyone for security reasons.
                            </p>

                            <p style="margin-top:25px;font-size:14px;color:#aaa;">
                                If you did not request this code, please ignore this email.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#f1f1f1;padding:15px;text-align:center;color:#888;font-size:13px;">
                            © ${new Date().getFullYear()} ILB Mart. All rights reserved.
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;


export const sendEmailOtpVerification = async (email,email_otp) => {
    const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'ILB Mart Email OTP Verification',
        html: htmlForOtpVerification(email_otp)
    }
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response)
        }
    })
}