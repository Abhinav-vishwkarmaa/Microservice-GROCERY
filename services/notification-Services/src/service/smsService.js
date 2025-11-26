import axios from "axios";
// import { logger } from "../utils/logger"; // optional logger

// SMS API config
const SMS_CONFIG = {
  apiUrl: "https://bulksmsplans.com/api/verify",
  apiId: "APIX10O3x8K139675",
  apiPassword: "1bTnrISh",
  sender: "ATRHWN",
};

// Generic SMS sender
export const sendSMS = async (mobile, verificationCode) => {
  try {
    // mobile validation
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      console.log(`Invalid mobile number: ${mobile}`);
      return false;
    }



    const params = {
      api_id: SMS_CONFIG.apiId,
      api_password: SMS_CONFIG.apiPassword,
      sms_type: "Transactional",
      sms_encoding: "text",
      sender: SMS_CONFIG.sender,
      number: mobile,
      message: `Your astrohawan verification number is ${verificationCode}. Welcome to astrohawan.`,
    };

    const response = await axios.get(SMS_CONFIG.apiUrl, { params });

    if (response.data && response.data.code === 200) {
      return true;
    } else {
      console.log("SMS failed:", response.data);
      return false;
    }
  } catch (error) {
    console.log("SMS Error:", error.message);
    console.log("API Response:", error.response?.data || "No response data");
    return false;
  }
};

// OTP SMS
export const sendOTPSMS = async (mobile, otp) => {
  const message = `Your ILB Mart verification number is ${otp}. Welcome to ILB Mart.`;

  const result = await sendSMS(mobile, message);

  // In development mode, allow success even if SMS API fails
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return result;
};

// Order confirmation
export const sendOrderConfirmationSMS = async (mobile, orderId) => {
  return await sendSMS(
    mobile,
    `Your order #${orderId} has been confirmed. Track your order on ILB Mart app.`
  );
};

// Delivery update
export const sendDeliveryUpdateSMS = async (
  mobile,
  orderId,
  status
) => {
  return await sendSMS(
    mobile,
    `Your order #${orderId} is ${status}. Track your order on ILB Mart app.`
  );
};

// Welcome message
export const sendWelcomeSMS = async (mobile, userName) => {
  return await sendSMS(
    mobile,
    `Welcome ${userName} to ILB Mart! Thank you for joining us.`
  );
};

// Password reset
export const sendPasswordResetSMS = async (mobile, resetCode) => {
  return await sendSMS(
    mobile,
    `Your ILB Mart password reset code is: ${resetCode}. Valid for 10 minutes.`
  );
};
