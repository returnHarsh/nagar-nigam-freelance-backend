import MongoStore from 'connect-mongo';
import session from 'express-session';

export const sessionMiddleware = (MONGO_CONNECTION_URI) => {
  return session({
    name: 'bewar-adminjs',
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_CONNECTION_URI,
      collectionName: 'sessions'
    }),
    cookie: {
      maxAge: 100*1000 * 60 * 60, // 100 hour
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',     // ✅ helps retain cookies across redirects
      path: '/bewar',     // ✅ matches your mount path
    },
  });
};
