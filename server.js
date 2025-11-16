import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import { connectDB } from "./config/db.js";
dotenv.config();

console.log('AWS_REGION:', process.env.AWS_REGION);

import { errorLogger, errorMiddleware } from "./utils/errorLogger.js";
import {adminRouter} from "./admin/adminRoute.js"
import {sessionMiddleware} from "./middlewares/sessionMiddleware.js"
import {router as interalAdminRoutes} from "./routes/adminInternalRoutes.js"
import s3PresignRoute from "./routes/s3PresignRoute.js";
// import * as url from 'url'
// const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
// import { gateKeeper } from "./middlewares/gateKeeper.js";


// importing routes
// import {router as adminDashboardRoutes} from "./routes/adminDashboardRoutes.js"
// import {router as usersData} from "./routes/usersRoutes.js"
// import {router as publicRouter} from "./routes/publicRoutes.js"

const PORT = process.env.PORT || 8000;
const app = express();


// ========== Serving static files like css file ====================
app.use(express.static("public"));

// =============== Global Middleware to decide which DB to connect ====================
// app.use(gateKeeper)

// configuring the cors middleware , allowing my registered frontend to talk to this backend
app.use(cors({
	origin : process.env.FRONTEND_URL,
	credentials : true
}))

app.use(sessionMiddleware(process.env.MONGO_URI));

// registering the adminjs
app.use("/admin" , adminRouter)
app.use("/admin/s3", s3PresignRoute);

// registering the body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/admin-internals" , interalAdminRoutes)


// health check and default route 
app.get("/" , (req,res)=>{
	console.log("Host Header : " , req.headers.host)
	console.log('Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
	return res.send(`<h2> Server Healthy 🙂 ${new Date()} </h2>`)
})

// app.use("/admin-info" , adminDashboardRoutes)
// app.use("/public" ,publicRouter)
// app.use("/users-data" , usersData)

// global error handler middleware , must place at the end
app.use(errorMiddleware);

const spinServer = async()=>{
	try{

		// connecting DB
		await connectDB();

		app.listen(PORT)
		.on("error" , err => console.error(`[ERROR] server offline : ${err.message}`))
		.on("listening" , ()=> console.log(`[INFO] server online on port ${PORT}`) )
		
	}catch(err){
		errorLogger(err , "spinServer");
	}
}

// starting the server
spinServer();