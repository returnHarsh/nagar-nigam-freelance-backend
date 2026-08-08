import { Property } from "../models/property.js";
import { User } from "../models/user.js";
import { PropertyEditRequest } from "../models/propertyEditRequest.js";
import { Tax } from "../models/tax.js";
import { Payment } from "../models/payment.js";
import { ARVModification } from "../models/arvModification.js";
import { errorLogger } from "../utils/errorLogger.js";
import mongoose from "mongoose"
import { generateUploadUrl } from "../config/S3.js";


// ======================= Get Upload Url ======================
export const getPresignedURLForUpload = async (req, res) => {
  try {

    const { filePrefix } = req.body;
    const { uploadUrl, key } = await generateUploadUrl(filePrefix);

    return res.status(200).json({ success: true, message: "Presigned URL fetched successfully", data: { uploadUrl, key } });

  } catch (err) {
    console.log("[ERROR] in getPresignedURLForUpload : ", err.message)
    return res.status(501)
  }
}

export const getAllSystemUsers = async (req, res) => {
  try {
    const users = await User.find({}).lean();

    return res.status(200).json({ succes: true, message: "All system users fetched successfully", data: users })

  } catch (err) {
    console.log("[ERROR] in getAllSystemUsers : ", err.message);
    return res.status(501).json({ succes: false, message: err.message });
  }
}


const totalDocs = async (query = {}, Collection) => {
  try {

    const totalDocsCount = await Collection.countDocuments(query);
    return totalDocsCount

  } catch (err) {
    console.log("[ERROR] in totalDocs : ", err.message);
  }
}

const getPaginatedData = async (req, Model, filterQuery = {}, populateFields = []) => {
  let { limit, cursor } = req.query;
  limit = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
  
  const query = { ...filterQuery };
  
  if (cursor) {
    if (!mongoose.Types.ObjectId.isValid(cursor)) {
      throw new Error("Invalid cursor");
    }
    query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }
  
  const total = await Model.countDocuments(query);
  
  let dbQuery = Model.find(query).sort({ _id: -1 }).limit(limit + 1).lean();
  if (populateFields.length > 0) {
     populateFields.forEach(field => {
       dbQuery = dbQuery.populate(field);
     });
  }
  
  const results = await dbQuery;
  
  const hasNextPage = results.length > limit;
  if (hasNextPage) {
    results.pop();
  }
  
  const nextCursor = results.length > 0 ? results[results.length - 1]._id : null;
  
  return {
    results,
    pagination: {
      totalDocsCount: total,
      hasNextPage,
      nextCursor,
      limit
    }
  };
};


// ====================== Taxes =====================
export const getAllTaxes = async (req, res) => {
  try {
    const { results, pagination } = await getPaginatedData(req, Tax, {}, ['propertyId']);
    return res.status(200).json({ success: true, message: "Taxes fetched successfully", data: { taxes: results, pagination } });
  } catch (err) {
    console.log("[ERROR] in getAllTaxes : ", err.message);
    if (err.message === "Invalid cursor") {
      return res.status(400).json({ success: false, message: "Invalid cursor" });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getTaxById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid tax ID" });
    }
    const tax = await Tax.findById(id).lean();
    if (!tax) {
      return res.status(404).json({ success: false, message: "Tax not found" });
    }
    return res.status(200).json({ success: true, message: "Tax fetched successfully", data: tax });
  } catch (err) {
    console.log("[ERROR] in getTaxById : ", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ====================== Payments =====================
export const getAllPayments = async (req, res) => {
  try {
    const { results, pagination } = await getPaginatedData(req, Payment, {}, ['propertyId']);
    return res.status(200).json({ success: true, message: "Payments fetched successfully", data: { payments: results, pagination } });
  } catch (err) {
    console.log("[ERROR] in getAllPayments : ", err.message);
    if (err.message === "Invalid cursor") {
      return res.status(400).json({ success: false, message: "Invalid cursor" });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid payment ID" });
    }
    const payment = await Payment.findById(id).lean();
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    return res.status(200).json({ success: true, message: "Payment fetched successfully", data: payment });
  } catch (err) {
    console.log("[ERROR] in getPaymentById : ", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ====================== ARVs =====================
export const getAllARVs = async (req, res) => {
  try {
    const { results, pagination } = await getPaginatedData(req, ARVModification, {}, ['propertyId']);
    return res.status(200).json({ success: true, message: "ARVs fetched successfully", data: { arvs: results, pagination } });
  } catch (err) {
    console.log("[ERROR] in getAllARVs : ", err.message);
    if (err.message === "Invalid cursor") {
      return res.status(400).json({ success: false, message: "Invalid cursor" });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getARVById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ARV ID" });
    }
    const arv = await ARVModification.findById(id).lean();
    if (!arv) {
      return res.status(404).json({ success: false, message: "ARV not found" });
    }
    return res.status(200).json({ success: true, message: "ARV fetched successfully", data: arv });
  } catch (err) {
    console.log("[ERROR] in getARVById : ", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
export const getProperties = async (req, res) => {
  try {
    let { limit, cursor } = req.query;
    const filterQueryFields = req.body


    let filterQuery = {}

    if (filterQueryFields) {
      filterQuery = builFilterQuery(filterQueryFields);
    }
    console.log("filter query is : ", filterQuery)

    // Default: 50
    // Min: 1
    // Max: 100
    limit = Math.max(
      1,
      Math.min(100, parseInt(limit, 10) || 50)
    );

    const query = {};

    // If cursor is provided, fetch documents after that cursor
    if (cursor) {
      if (!mongoose.Types.ObjectId.isValid(cursor)) {
        return res.status(400).json({
          success: false,
          message: "Invalid cursor",
        });
      }

      query._id = {
        $lt: new mongoose.Types.ObjectId(cursor),
      };
    }

    const total = await totalDocs({ ...query, ...filterQuery }, Property)

    // Fetch one extra document to determine if another page exists
    const properties = await Property.find({ ...query, ...filterQuery })
      .populate("tax")
      .populate("surveyor")
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNextPage = properties.length > limit;

    // Remove the extra document before sending response
    if (hasNextPage) {
      properties.pop();
    }

    const nextCursor =
      properties.length > 0
        ? properties[properties.length - 1]._id
        : null;

    return res.status(200).json({
      success: true,
      message: "Properties fetched successfully",
      data: {
        properties,
        pagination: {
          totalDocsCount: total,
          hasNextPage,
          nextCursor,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get Properties Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// =============== filter options for properties ==========

function builFilterQuery(queryField) {
  const { ownerName, phoneNumber, fatherName, PTIN, wardNumber, ward } = queryField;
  const query = {}

  if (ownerName) query.ownerName = { $regex: ownerName, $options: "i" };
  if (phoneNumber) query.phoneNumber = { $regex: phoneNumber, $options: "i" };
  if (fatherName) query.fatherName = { $regex: fatherName, $options: "i" };
  if (PTIN) query.PTIN = PTIN;
  if (wardNumber) query.wardNumber = wardNumber;
  if (ward) query.ward = ward;

  return query;

}

export const filterProperties = async (req, res) => {
  try {

    const filterOptions = req.body;
    const query = builFilterQuery(filterOptions);

    const filteredProperties = await Property.find(query);

    return res.status(200).json({ succes: true, message: "Properties fetched successfully", data: filterProperties });

  } catch (err) {
    console.log('[ERRPR] in filterProperties : ', err.message);
    return res.status(500).json({ succes: false, message: err.message });
  }
}


// =========== controller to show individual property ==============================
export const getProperty = async (req, res) => {
  try {

    const { propertyId } = req.body;
    const isValid = mongoose.Types.ObjectId.isValid(propertyId);

    const query = {
      $or: [
        { PTIN: propertyId },
        ...(isValid ? [{ _id: new mongoose.Types.ObjectId(propertyId) }] : []),
      ],
    };

    const property = await Property.findOne(query)
      .populate("tax")
      .populate("surveyor")
      .lean();

    return res.status(200).json({ succes: true, message: "Property Found Successfully", data: property })


  } catch (err) {
    console.log("[Error] in getProperty : ", err.message);
    return res.status(501).json({ succes: false, message: "Internal Server Error" })
  }
}

// ============ Property Edit Requests Workflow ============

export const createEditRequest = async (req, res) => {
  try {
    const { propertyId, proposedChanges } = req.body;

    // Fallback if req.user is populated by an auth middleware
    const requestedBy = req.user ? req.user._id : req.body.requestedBy;

    if (!requestedBy) {
      return res.status(401).json({ success: false, message: "Unauthorized: User information missing" });
    }

    if (!propertyId || !proposedChanges) {
      return res.status(400).json({ success: false, message: "propertyId and proposedChanges are required" });
    }

    const newRequest = await PropertyEditRequest.create({
      propertyId,
      requestedBy,
      proposedChanges,
      status: "pending"
    });

    return res.status(201).json({ success: true, message: "Edit request submitted successfully", data: newRequest });
  } catch (err) {
    console.log("[ERROR] in createEditRequest : ", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getPendingEditRequests = async (req, res) => {
  try {
    const requests = await PropertyEditRequest.find({ status: "pending" })
      .populate("propertyId")
      .populate("requestedBy", "name email role")
      .lean();

    return res.status(200).json({ success: true, message: "Pending edit requests fetched", data: requests });
  } catch (err) {
    console.log("[ERROR] in getPendingEditRequests : ", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const reviewEditRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, reviewRemarks } = req.body;

    // Fallback if req.user is populated by an auth middleware
    const reviewedBy = req.user ? req.user._id : req.body.reviewedBy;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'approved' or 'rejected'" });
    }

    const editRequest = await PropertyEditRequest.findById(requestId);
    if (!editRequest) {
      return res.status(404).json({ success: false, message: "Edit request not found" });
    }

    if (editRequest.status !== "pending") {
      return res.status(400).json({ success: false, message: "Edit request is already processed" });
    }

    editRequest.status = status;
    editRequest.reviewedBy = reviewedBy;
    editRequest.reviewRemarks = reviewRemarks;

    if (status === "approved") {
      // Apply the changes to the Property
      const property = await Property.findById(editRequest.propertyId);
      if (!property) {
        return res.status(404).json({ success: false, message: "Associated property not found" });
      }

      // Update fields
      const proposed = editRequest.proposedChanges;
      for (const key in proposed) {
        property[key] = proposed[key];
      }

      await property.save();
    }

    await editRequest.save();

    return res.status(200).json({ success: true, message: `Edit request ${status} successfully`, data: editRequest });
  } catch (err) {
    console.log("[ERROR] in reviewEditRequest : ", err.message);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};