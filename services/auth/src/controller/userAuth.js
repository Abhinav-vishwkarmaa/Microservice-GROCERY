
import axios from "axios";
import { query } from "../config/db.js";
import jwt from "jsonwebtoken";
import "dotenv/config"
const notificationServiceUrl = `http://localhost:3005/api`;
const user_table = `mtbl_customers`
const user_otp_table = `mtbl_customer_otp`
export const sendOtp = async (req,res) =>{
    const {mobile} = req.body;
    //rate checking
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await query(`INSERT INTO ${user_otp_table} (mobile,otp,is_verify) VALUES (?,?,?)
        ON DUPLICATE KEY UPDATE otp = ? , is_verify = ?`,[mobile,otp,0,otp,0])
    const result = await query(`SELECT * FROM ${user_otp_table} WHERE mobile = ?`,[mobile])
    await axios.post(`${notificationServiceUrl}/sms/send`,{mobile,otp})
    res.status(200).json({message:"Otp sent successfully"})


}
export const verifyOtp = async(req ,res) =>{
    try {
        const {mobile ,otp} = req.body;
        const [checkOtp] = await query(`SELECT * FROM ${user_otp_table} WHERE mobile = ? AND otp = ? AND is_verify = ?`,[mobile,otp,0])
        if(checkOtp.length > 0){
            await query(`UPDATE ${user_otp_table} SET is_verify = ? WHERE mobile = ?`,[1,mobile])
            await query(`INSERT INTO ${user_table} (mobile) VALUES (?) ON DUPLICATE KEY UPDATE mobile = ?`,[mobile,mobile])
            const [user] = await query(`SELECT * FROM ${user_table} WHERE mobile = ?`,[mobile])
            const token = jwt.sign({id:user.id,mobile:user.mobile},process.env.JWT_SECRET_USER,{expiresIn:"1h"})
            res.status(200).json({message:"Otp verified successfully" , token , user})
        }else{
            res.status(400).json({message:"Invalid otp"})
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({message:error.message})
    }
}

