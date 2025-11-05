import MongoStore from 'connect-mongo';
import session from "express-session"

console.log("mongo uri ", process.env.MONGO_URI)

export const sessionMiddleware = (MONGO_CONNECTION_URI) => {

	return session({
		name: "express-session",
		secret: process.env.SECRET_KEY,
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl: MONGO_CONNECTION_URI,
			collectionName: 'sessions'
		}),
		cookie: {
			maxAge: 1000 * 60 * 60 * 10,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production'
		}
	})

}