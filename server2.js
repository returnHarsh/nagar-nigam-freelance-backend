import express from "express";
import AdminJS from "adminjs";
import * as AdminJSExpress from "@adminjs/express";

const dummyAuthenticate = async (email, password) => {
  if (email === "admin" && password === "123") return { email };
  return null;
};

const PORT = 5000;

const startAdmin = async () => {
  const app = express();

  app.get("/karhal" , (req,res)=>{
	return res.send("Karhal")
  })

  // 👇 Step 1: Set rootPath with full base route
  const admin = new AdminJS({
    rootPath: "/karhal/new/admin",
    loginPath: "/karhal/new/admin/login",     // 👈 important
    logoutPath: "/karhal/new/admin/logout",   // 👈 important
  });

  // 👇 Step 2: Auth router
  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate: dummyAuthenticate,
      cookieName: "karhal-adminjs",
      cookiePassword: "karhal-12345",
    },
    null,
    {
      resave: false,
      saveUninitialized: true,
    }
  );

  // 👇 Step 3: Mount directly (no extra nesting)
  app.use("/karhal/new/admin", adminRouter);

  app.listen(PORT, () => {
    console.log(
      `✅ AdminJS running at http://localhost:${PORT}${admin.options.rootPath}`
    );
  });
};

startAdmin();
