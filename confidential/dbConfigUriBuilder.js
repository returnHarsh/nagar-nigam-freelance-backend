// import { errorLogger } from "../utils/errorLogger.js"


// const DB_NAME = ""

// export const getDBName = (hostName)=>{
// 	try{
// 		DB_NAME = hostName
// 		return hostName
// 	}catch(err){
// 		errorLogger(err , "getDBName");
// 	}
// }

// export const 



import { errorLogger } from "../utils/errorLogger.js";

class DB_CONFIG {
    constructor() {
        this.DB_NAME = "";
    }

    setDBName(hostName) {

		// ===== logic here to extract the name of subdomain ==========


		// ===== returning the name of DB to use while constructing the connection uri =====
        this.DB_NAME = hostName;
    }

    getDBName() {
        return this.DB_NAME;
    }

	getDBConnectionURI(){
		const clusterURI = process.env.MONGO_URI;
		return `${clusterURI}/${this.DB_NAME}`
	}

}


export const dbConfigGlob = new DB_CONFIG();
