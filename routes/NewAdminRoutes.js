import express from "express"
import { protect } from "../middlewares/protect.js";
import { getAllSystemUsers, getProperties } from "../controllers/NewAdminControllers.js";
import { generateLedger } from "../controllers/ledgerController.js";

export const router = express.Router();

router.get("/get-system-users", protect, getAllSystemUsers)
// router.post("/get-properties" , protect , getProperties)
router.post("/get-properties", getProperties)
router.post("/generate-ledger", generateLedger)