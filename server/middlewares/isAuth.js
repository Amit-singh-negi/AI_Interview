import jwt from "jsonwebtoken"

const isAuth = async (req,res,next) =>{
     console.log("Cookies:", req.cookies);
    try {
        let {token} = req.cookies

        if(!token){
        return res.status(400).json({message:"user does not have a token"})
        }
        const verifyToken = jwt.verify(token , process.env.JWT_SECRET)

        if(!verifyToken){
            return res.status(400).json({message:"user does not have a valid token"})
        }
        req.userId = verifyToken.userId

        next()
        
    } catch (error) {
        return res.status(400).json({message:`isAuth error ${error}`})
    }
}

export default isAuth;