import express from "express";
import { generateAndDownloadBulkBill } from "../admin/actions/generateAndDownloadBulkBill.js";



export const router = express.Router();



router.get("/bulk-generate-bill" , generateAndDownloadBulkBill)

