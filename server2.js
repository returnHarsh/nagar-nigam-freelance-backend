import express from "express";
import AdminJS from "adminjs";
import * as AdminJSExpress from "@adminjs/express";

const dummyAuthenticate = async (email, password) => {
  if (email === "admin" && password === "123") return { email };
  return null;
};

const PORT = 8000;

const startAdmin = async () => {
  const app = express();

  app.get("/bewar" , (req,res)=>{
	return res.send("karhal")
  })

  // 👇 Step 1: Set rootPath with full base route
  const admin = new AdminJS({
    rootPath: "/bewar/new/admin",
    loginPath: "/bewar/new/admin/login",     // 👈 important
    logoutPath: "/bewar/new/admin/logout",   // 👈 important
  });

  // 👇 Step 2: Auth router
  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate: dummyAuthenticate,
      cookieName: "bewar-adminjs",
      cookiePassword: "bewar-12345",
    },
    null,
    {
      resave: false,
      saveUninitialized: true,
    }
  );

  // 👇 Step 3: Mount directly (no extra nesting)

  app.use(express.json())
  // app.use(express.urlencoded({extended : true}))

  app.use("/bewar/new/admin", adminRouter);

  app.listen(PORT, () => {
    console.log(
      `✅ AdminJS running at http://localhost:${PORT}${admin.options.rootPath}`
    );
  });
};

startAdmin();
