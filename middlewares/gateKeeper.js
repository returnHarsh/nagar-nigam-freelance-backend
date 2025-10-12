import { errorLogger } from "../utils/errorLogger.js"

export const gateKeeper = async(req,res,next)=>{
	try{

		const host = req.headers.host
		const fullURL = req.protocol + '://' + req.get('host') + req.originalUrl


		// ======== Constructing the DB name and final DB URI according to host name ===========

		next();
	}catch(err){
		errorLogger(err , "gateKeeper");
	}
}