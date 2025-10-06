import express from "express"
import { getLocations } from "../controllers/publicController.js";
export const router = express.Router();


router.get("/get-locations" , getLocations)



