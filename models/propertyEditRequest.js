import mongoose from "mongoose";

const propertyEditRequestSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // The proposed new fields and values
  proposedChanges: { type: mongoose.Schema.Types.Mixed, required: true },
  
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending" 
  },
  
  // Admin who reviewed the request
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewRemarks: { type: String }
}, { timestamps: true });

export const PropertyEditRequest = mongoose.model("PropertyEditRequest", propertyEditRequestSchema);
