import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  meta: mongoose.Schema.Types.Mixed,
  changeHistoryRef : {type : mongoose.Schema.Types.ObjectId , ref : 'ChangeHistory'}
} , {timestamps : true} )

export const AuditLog = mongoose.model("AuditLog" , auditLogSchema);