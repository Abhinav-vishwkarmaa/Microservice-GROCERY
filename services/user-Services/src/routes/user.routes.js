import express from 'express'
import { getUserProfile , updateProfile , updateProfileImage } from '../controllers/user.controller.js'
const router = express.Router()
router.get('/profile', getUserProfile)
router.post('/update-profile', updateProfile)
router.post('/update-profile-image', updateProfileImage)
export default router
