import jwt from "jsonwebtoken"

export const protect = async (req, res, next) => {
	try {
		
		// 1. Getting token from cookie
		const token = req.cookies?.token

		if (!token) {
			return res.status(401).json({ message: "Unauthorized: No token provided" })
		}

		// 2. Verify token
		const user = jwt.verify(token, process.env.SECRET_KEY)

		console.log("after decoding user token is : " , user)

		// 3. Attach decoded user data to req for later use
		req.user = user

		// 4. Continue
		next()

	} catch (err) {
		console.log("[ERROR] in protect middleware : " , err.message);
    	return res.status(500).json({success : false , message : err.message})
	}
}

export const adminOnly = async()=>{
	try{
		user = req.user;
		if(user.role !== "admin") handleError({message : "Admin Only , Not aythorized !!" , status : 401 , funcName : "adminOnly middleware"} , res)
			
		next()

	}catch(err){
		console.log("[ERROR] in adminOnly middleware : " , err.message);
    	return res.status(500).json({success : false , message : err.message})
	}
}

// seperate function to check the user which is requesting is admin

export const adminOnlyV2 = async(req,res,next)=>{
	try{

		const token = req.cookies?.token
		if(!token){
			res.status(500).json({message : "Not authorized" , status : 401 , funcName : "adminOnly middleware"} , res)
		}
		
		const user = jwt.verify(token , process.env.SECRET_KEY)
		console.log("after decoding the user token for admin only is : " , user);

		// checking if the role of this user is admin or not
		if(user.role !== "admin") return res.status(500).json({message : "Admin Only , Not aythorized !!" , status : 401 , funcName : "adminOnly middleware"} , res)

		req.user = user;
		next();

	}catch(err){
		// handleError(err , res)
		console.log("[ERROR] in adminOnlyV2 middleware : " , err.message);
    	return res.status(500).json({success : false , message : err.message})
	}
}