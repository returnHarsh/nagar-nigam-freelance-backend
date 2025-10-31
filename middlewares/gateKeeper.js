import { errorLogger } from "../utils/errorLogger.js";

export const gateKeeper = async (req, res, next) => {
  try {
	console.log("🧿 🧿 🧿 🧿 🧿 inside the main gateKeeper")
    const host = req.headers.host; // e.g. karhal.api.npup.in or npup.in
    const fullURL = req.protocol + "://" + req.get("host") + req.originalUrl;

    // ======== Extracting the first subdomain name ===========

    // Split host by '.' and remove port if present
    const cleanHost = host.split(":")[0];
    const parts = cleanHost.split(".");

    // Example:
    // parts = ['karhal', 'api', 'npup', 'in']
    // If the length > 2, then we have at least one subdomain
    const subdomain = parts.length > 2 ? parts[0] : null; // 'karhal' in example, null if npup.in

    console.log("Full URL:", fullURL);
    console.log("Host:", host);
    console.log("Subdomain:", subdomain);

    // You can use subdomain to determine DB name, etc.
    req.subdomain = subdomain;
	  console.log("subdomain is : " , subdomain)

    // ================ Creating a mongo connection for this subdomain =====================
    

    next();
  } catch (err) {
    errorLogger(err, "gateKeeper");
  }
};
