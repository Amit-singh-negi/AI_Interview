import dotenv from 'dotenv';
import express from 'express';
import connectDb from './config/connectDb.js';
dotenv.config()
import cookieParser from 'cookie-parser';
import cors from 'cors'

import authRouter from './routes/auth.route.js'
import userRoute from './routes/userRoute.js';
import interviewRouter from './routes/interviewRoute.js';
import paymentRouter from './routes/payment.route.js';

const app = express();
app.use(cors({
    origin:"https://ai-interview-client-afiy.onrender.com",
    credentials:true
}))

app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRouter)
app.use("/api/user", userRoute)
app.use("/api/interview", interviewRouter)
app.use("/api/payment",paymentRouter)

const PORT = process.env.PORT || 6000



 app.listen(PORT, ()=>{
    console.log(`server running on port ${PORT}`);
    connectDb()
    
 })


 
