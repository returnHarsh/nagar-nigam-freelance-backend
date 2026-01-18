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
// import { gateKeeper } from "./middlewares/gateKeeper.js";


// importing routes
import {router as adminDashboardRoutes} from "./routes/adminDashboardRoutes.js"
// import {router as usersData} from "./routes/usersRoutes.js"
// import {router as publicRouter} from "./routes/publicRoutes.js"

const PORT = process.env.PORT || 8000;
const app = express();

// ========== Serving static files like css file ====================
app.use(express.static("public"));

// ============== Main Bewar Router ======================
const BewarRouter = express.Router();

// configuring the cors middleware , allowing my registered frontend to talk to this backend
app.use(cors({
	origin : process.env.FRONTEND_URL,
	credentials : true
}))

app.use(sessionMiddleware(process.env.MONGO_URI));

// =============== Body parser middleware ================
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '5mb', extended: true }));

// ================= Main AdminJs Route ===================
BewarRouter.use("/admin" , adminRouter)

// =============== Body parser middleware ================
app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));


// ============ Route to handle adminjs internal functions ================
BewarRouter.use("/admin-internals" , interalAdminRoutes)


// ============ Health check and default route ===============
BewarRouter.get("/" , (req,res)=>{
	console.log("Host Header : " , req.headers.host)
	console.log('Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
	return res.send(`<h2> Server Healthy 🙂 ${new Date()} </h2>`)
})

BewarRouter.use("/admin-info" , adminDashboardRoutes)
// BewarRouter.use("/public" ,publicRouter)
// BewarRouter.use("/users-data" , usersData)



// ============== Now all the request goes through /bewar =============
app.use("/bewar" , BewarRouter)


// ============== Global Error middleware , must be placed in last ==============
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