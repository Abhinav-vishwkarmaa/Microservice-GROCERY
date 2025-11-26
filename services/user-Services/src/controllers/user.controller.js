import { query } from "../../config/db.js";
import sharp from "sharp";
import uuidv4 from "uuidv4";
const notificationServiceUrl = `http://localhost:3005/api`;
const user_table = `mtbl_customers` 
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [user] = await query(`SELECT * FROM ${user_table} WHERE id = ?`,[userId])
        res.json(user)
    } catch (error) {
        console.log(error)
        res.status(500).json({message:error.message})
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {name , email , mobile} = req.body;
        let fields = []
        let values = []
        if(name){
            fields.push("name")
            values.push(name)
        }
        if(email){
            fields.push("email")
            values.push(email)
        }
        if(mobile){
            fields.push("mobile")
            values.push(mobile)
        }
        values.push(userId)
        const [user] = await query(`UPDATE ${user_table} SET ${fields.join(" , ")} WHERE id = ?`,values)
        res.json(user)
    } catch (error) {
        console.log(error)
        res.status(500).json({message:error.message})
    }
}
export const updateProfileImage = async (req, res) => {
    try {
        const userId = req.user.id;
        const {image} = req.file;
        if(!image){
            return res.status(400).json({message:"Image is required"})
        }
        const sharpImage = sharp(image)
        .resize({width: 500, height: 500})
        .toBuffer();
        const imagekey = image.filename + "_" + uuidv4();
        const [user] = await query(`UPDATE ${user_table} SET image = ? WHERE id = ?`,[imagekey,userId])
        res.json(user)
    } catch (error) {
        console.log(error)
        res.status(500).json({message:error.message})
    }
}
export const changeMoblie = async (req, res) => {
    try {
        const userId = req.user.id;
        const {mobile} = req.body;
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        await query(`INSERT INTO mtbl_customer_otp (mobile,otp,is_verify) VALUES (?,?,?)
            ON DUPLICATE KEY UPDATE otp = ? , is_verify = ?`,[mobile,otp,0,otp,0])
        const result = await query(`SELECT * FROM mtbl_customer_otp WHERE mobile = ?`,[mobile])
        axios.post(`${notificationServiceUrl}/sms/send`,{mobile,otp})
        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(500).json({message:error.message})
    }
}
export const verifyOtp = async (req, res) => {
    try {
        const userId = req.user.id;
        const {mobile ,otp} = req.body;
        const [checkOtp] = await query(`SELECT * FROM mtbl_customer_otp WHERE mobile = ? AND otp = ? AND is_verify = ?`,[mobile,otp,0])
        if(checkOtp.length > 0){
            await query(`UPDATE mtbl_customer_otp SET is_verify = ? WHERE mobile = ?`,[1,mobile])
            await query(`UPDATE mtbl_customers SET mobile = ? WHERE id = ?`,[mobile,userId])
            const [user] = await query(`SELECT * FROM mtbl_customers WHERE id = ?`,[userId])
            res.status(200).json({message:"Mobile number updated successfully" , user})
        }else{
            res.status(400).json({message:"Invalid otp"})
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({message:error.message})
    }
}