import express from "express"
import { protect } from "../middlewares/protect.js";
import { getAllSystemUsers, getProperties, getProperty, createEditRequest, getPendingEditRequests, reviewEditRequest, getAllTaxes, getTaxById, getAllPayments, getPaymentById, getAllARVs, getARVById, getPresignedURLForUpload } from "../controllers/NewAdminControllers.js";
import { generateLedger } from "../controllers/ledgerController.js";

export const router = express.Router();

router.get("/get-system-users", protect, getAllSystemUsers)
// router.post("/get-properties" , protect , getProperties)
router.post("/get-properties", getProperties)
router.post("/generate-ledger", generateLedger)
router.post("/get-property", protect, getProperty)

// Property Edit Approval Workflow Routes
router.post("/property/edit-request", protect, createEditRequest)
router.get("/property/edit-requests/pending", protect, getPendingEditRequests)
router.post("/property/edit-requests/:requestId/review", protect, reviewEditRequest)

// get presigned url route
router.post("/get-presigned-url", protect, getPresignedURLForUpload)

// Tax Routes
router.get("/taxes", protect, getAllTaxes);
router.get("/taxes/:id", protect, getTaxById);

// Payment Routes
router.get("/payments", protect, getAllPayments);
router.get("/payments/:id", protect, getPaymentById);

// ARV Modification Routes
router.get("/arvs", protect, getAllARVs);
router.get("/arvs/:id", protect, getARVById);