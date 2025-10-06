import { AuditLog } from "../../models/auditLog.js";
import { errorLogger } from "../../utils/errorLogger.js";

/**
 * Logs an action performed by a user into the AuditLog collection.
 *
 * @async
 * @function logAuditAction
 * @param {String|ObjectId} actor - Reference ID of the user who performed the action
 * @param {String} action - Type of action performed ('created', 'updated', 'deleted', etc.)
 * @param {String} entityType - Name of the model/entity on which the action was performed
 * @param {String|ObjectId} entityId - Reference ID of the affected entity
 * @param {Object} meta - Additional metadata such as IP address, device info, or any other context
 *
 * @returns {Promise<import("mongoose").Document>} - Returns the created AuditLog document
 */
export const logAuditAction = async (changeHistoryRef , actor, action, entityType, entityId, meta , session) => {
  try {

    const options = session ? { session } : {};

    return await AuditLog.create([{
      changeHistoryRef,
      actor,
      action,
      entityType,
      entityId,
      meta,
    }] , options);

  } catch (err) {
    // Log error internally, so audit logging never crashes main flow
    errorLogger(err, "catchLogs");
  }
};
