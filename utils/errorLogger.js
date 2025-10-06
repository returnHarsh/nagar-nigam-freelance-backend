import { ValidationError } from "adminjs";

export const errorLogger = (err , fName)=>{
	console.error(`[ERROR] in ${fName} : ${err.message}`)
	throw err;
}

export const errorMiddleware = (err , req , res , next)=>{
	if(err){
		console.error(`[ERROR] caught in main error middleware : ${err.message}`)
		return res.status(500).json({sucess : false , message : err.message || "Internal Server ERROR!!"});
	}
}

export const validatonError = (propertyName , message)=>{
	if(propertyName) throw new ValidationError({[propertyName] : {message}  })
	throw new ValidationError({} , {message})
}