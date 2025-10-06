import { ChangeHistory } from "../../models/ChangeHistory.js";
import { errorLogger } from "../../utils/errorLogger.js"
import bcrypt from "bcrypt";


const FIELDS_TO_IGNORE = ["createdAt" , "updatedAt" , "password" , "displayId"]

// ============ OLD DIFF ALGORITHM =======================
// function diffObjects(oldDoc = {}, newDoc = {}) {
// 	const changes = [];
// 	const keys = new Set([...Object.keys(oldDoc), ...Object.keys(newDoc)]);
// 	keys.forEach(k => {
// 		if(FIELDS_TO_IGNORE.includes(k)) return;
// 		const a = oldDoc[k];
// 		const b = newDoc[k];
// 		if (JSON.stringify(a) !== JSON.stringify(b)) {
// 			changes.push({ field: k, oldValue: a, newValue: b });
// 		}
// 	});
// 	return changes;
// }

// ================ NEW DIFF ALGORITHM ====================
function diffObjects(oldDoc = {}, newDoc = {}, FIELDS_TO_IGNORE = []) {
	const changes = [];
	const keys = new Set([...Object.keys(oldDoc), ...Object.keys(newDoc)]);
	
	keys.forEach(k => {
		if(FIELDS_TO_IGNORE.includes(k)) return;
		
		const oldValue = oldDoc[k];
		const newValue = newDoc[k];
		
		// Skip if both are undefined/null
		if (oldValue == null && newValue == null) return;
		
		// Deep compare that handles key ordering
		if (!deepEqual(oldValue, newValue)) {
			changes.push({ 
				field: k,
				oldValue: oldValue,  // Will be undefined if field didn't exist in oldDoc
				newValue: newValue   // Will be undefined if field doesn't exist in newDoc
			});
		}
	});
	
	return changes;
}

function deepEqual(a, b) {
	// Handle primitives and null/undefined
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (typeof a !== 'object' || typeof b !== 'object') return false;
	
	// Handle arrays
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((val, idx) => deepEqual(val, b[idx]));
	}
	
	// Handle objects
	if (Array.isArray(a) || Array.isArray(b)) return false;
	
	const keysA = Object.keys(a);
	const keysB = Object.keys(b);
	
	if (keysA.length !== keysB.length) return false;
	
	return keysA.every(key => 
		keysB.includes(key) && deepEqual(a[key], b[key])
	);
}


export const changeHistoryAction = async (oldDoc , newDoc , entityType ,entityId , changedBy , meta) => {
	try {
		const changes = diffObjects(oldDoc , newDoc , FIELDS_TO_IGNORE);

		if(changes.length == 0) return null

		return await ChangeHistory.create({
			entityType , entityId , changedBy , changes , meta
		})

	} catch (err) {
		errorLogger(err, "changeHistoryAction");
	}
}