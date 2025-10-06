import express from "express"
import { getUserData } from "../controllers/adminDashboardController.js";
export const router = express.Router();


router.post("/search" , getUserData);