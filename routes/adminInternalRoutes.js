import express from "express";
import { generateAndDownloadBulkBill, getPropertyId } from "../admin/actions/generateAndDownloadBulkBill.js";
import { downloadProperyExcel } from "../controllers/adminInternalsController.js";



export const router = express.Router();



router.get("/bulk-generate-bill" , generateAndDownloadBulkBill)
router.post("/get-property-id" , getPropertyId)
router.get("/properties-download/:wardNumber" , downloadProperyExcel)
