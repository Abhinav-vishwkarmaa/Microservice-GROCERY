import bcrypt from "bcrypt";
const notificationServiceUrl = `http://localhost:3005/api`;
export const register = async (req, res) => {
    const { name, email, password, mobile } = req.body;

    const existingUser = await query(
        `SELECT * FROM mtbl_admin WHERE email = ? OR mobile = ?`,
        [email, mobile]
    );

    // ---------------------------
    // CASE 1: User exists & verified → BLOCK
    // ---------------------------
    if (existingUser.length > 0 && existingUser[0].is_verify === 1) {
        return res.status(400).json({ message: "User already verified" });
    }

    // Generate OTPs
    const mobileOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const emailOtp  = Math.floor(1000 + Math.random() * 9000).toString();

    // ---------------------------
    // CASE 2: User exists but NOT verified → RESEND OTP (don't insert new user)
    // ---------------------------
    if (existingUser.length > 0 && existingUser[0].is_verify === 0) {

        await query(
            `INSERT INTO mtbl_admin_otp (mobile, mobile_otp, email_otp, is_verify)
             VALUES (?, ?, ?, 0)
             ON DUPLICATE KEY UPDATE 
                mobile_otp = VALUES(mobile_otp),
                email_otp = VALUES(email_otp),
                is_verify = 0`,
            [mobile, mobileOtp, emailOtp]
        );

        await axios.post(`${notificationServiceUrl}/sms/send`, { mobile, mobileOtp });
        await axios.post(`${notificationServiceUrl}/email/send`, { email, emailOtp });

        return res.status(200).json({
            message: "OTP sent. Please verify your account."
        });
    }

    // ---------------------------
    // CASE 3: New User → Insert user + send OTP
    // ---------------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    await query(
        `INSERT INTO mtbl_admin (name, email, password, mobile, is_verify)
         VALUES (?, ?, ?, ?, 0)`,
        [name, email, hashedPassword, mobile]
    );

    await query(
        `INSERT INTO mtbl_admin_otp (mobile, mobile_otp, email_otp, is_verify)
         VALUES (?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE 
            mobile_otp = VALUES(mobile_otp),
            email_otp = VALUES(email_otp),
            is_verify = 0`,
        [mobile, mobileOtp, emailOtp]
    );

    await axios.post(`${notificationServiceUrl}/sms/send`, { mobile, mobileOtp });
    await axios.post(`${notificationServiceUrl}/email/send`, { email, emailOtp });

    return res.status(200).json({
        message: "User registered successfully. OTP sent to mobile & email."
    });
};

export const verifyOtp = async(req,res) =>{
    const {mobile , email , mobile_otp ,email_otp} = req.body;
    const checkOtp = await query(`SELECT * FROM mtbl_admin_otp WHERE mobile = ? AND mobile_otp = ? AND email_otp = ? AND is_verify = ?`,[mobile,mobile_otp,email_otp,0])
    if(checkOtp.length > 0){
        if(checkOtp[0].is_verify ===1){
            res.status(400).json({message:"Otp already verified"})
        }else{
            await query(`UPDATE mtbl_admin_otp SET is_verify = ? WHERE mobile = ? AND mobile_otp = ? AND email_otp = ?`,[1,mobile,mobile_otp,email_otp])
            await query(`UPDATE mtbl_admin SET is_verify = ? WHERE mobile = ? AND email = ?`,[1,mobile,email])
            res.status(200).json({message:"Otp verified successfully"})
        }
    }else{
        res.status(400).json({message:"Invalid mobile number"})
    }
}

export const login = async(req,res) =>{
    const {email ,password} = req.body;
    const checkUser = await query(`SELECT * FROM mtbl_admin WHERE email = ?`,[email])
    if(checkUser.length > 0){
        const checkPassword = await bcrypt.compare(password,checkUser[0].password)
        if(checkPassword){
            res.status(200).json({message:"User logged in successfully"})
        }else{
            res.status(400).json({message:"Invalid password"})
        }
    }else{
        res.status(400).json({message:"User not found"})
    }
}