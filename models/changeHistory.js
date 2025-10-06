import mongoose from "mongoose";


const changeHistorySchema = new mongoose.Schema({
	entityType: { type: String, required: true },
  	entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  	changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  	changes: [{ field: String, oldValue: mongoose.Schema.Types.Mixed, newValue: mongoose.Schema.Types.Mixed }],
  	reason: {type : String},
  	proofDocument: {type : String},
	meta : {type : mongoose.Schema.Types.Mixed}
} , {timestamps : true})

export const ChangeHistory = mongoose.model("ChangeHistory" , changeHistorySchema)