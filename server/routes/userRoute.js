import express from 'express'
import isAuth from '../middlewares/isAuth.js'
import { getCurrentUser } from '../controllers/userController.js'



const userRoute = express.Router()
userRoute.get("/current-user", isAuth,getCurrentUser)

export default userRoute