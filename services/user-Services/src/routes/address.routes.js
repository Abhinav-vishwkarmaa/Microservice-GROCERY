import express from 'express'
import { createAddress, deleteAddress, getAllAddress, getDetailAddress, updateAddress , makePrimary} from '../controllers/address.controller.js'
const router = express.Router()
router.post('/create', createAddress)
router.get('/list', getAllAddress)
router.get('/detail/:id', getDetailAddress)
router.put('/update/:id', updateAddress)
router.put('/make-primary/:id', makePrimary)
router.delete('/delete/:id', deleteAddress)
export default router