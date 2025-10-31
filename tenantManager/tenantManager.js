import mongoose from "mongoose";


// ===================== Here creating a seperate connection for every tenant and caching it ===========================


const connections = {};

export const getTenantConnection = async (tenant) => {
  if (!tenant) throw new Error("❌ No tenant provided");

  if (connections[tenant]) return connections[tenant];

  const uri = `${process.env.MONGO_URI_CLUSTER}/${tenant}`;
  const conn = mongoose.createConnection(uri);

  conn.on("connected", () => console.log(`✅ Connected to ${tenant}`));
  conn.on("error", (err) => console.error(`❌ DB error (${tenant}):`, err));

  connections[tenant] = conn;
  return conn;
};
