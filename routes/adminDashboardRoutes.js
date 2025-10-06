

import express from "express"
import {protect} from "../middlewares/protect.js"
import { chartStatsData, chartStatsDataInDepth, getDashboardStats, getLatestSurveyActivities, getSurveyorDataForRecord, getUserData, login } from "../controllers/adminDashboardController.js";

export const router = express.Router();

// this is the middleware to allow only signedin users
// router.use(protect)

// additional middleware to allow only admins
// router.use(adminOnly)


router.post("/get-recent-activities" , getLatestSurveyActivities)
router.post("/surveyor-info" , getSurveyorDataForRecord)
router.post("/login" , login)
router.post("/stats" , getDashboardStats)
router.post("/user-view" , getUserData)
router.post("/graph-stats" , chartStatsData)
router.post("/graph-stats-detail" , chartStatsDataInDepth)
