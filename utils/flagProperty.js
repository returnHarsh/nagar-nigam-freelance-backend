import { Property } from "../models/property.js";

export const flagPropertyForReceiptGen = async (property) => {
  try {
    if (!property) {
      throw new Error("Property is not provided");
    }

    let updatedProperty = null;

    // 1️⃣ Prefer _id
    if (property._id) {
      updatedProperty = await Property.findByIdAndUpdate(
        property._id,
        { $set: { isProcessed: false } },
        { new: true }
      );
    }
    // 2️⃣ Fallback to PTIN
    else if (property.PTIN) {
      updatedProperty = await Property.findOneAndUpdate(
        { PTIN: property.PTIN },
        { $set: { isProcessed: false } },
        { new: true }
      );
    }
    // 3️⃣ Nothing usable
    else {
      throw new Error("Neither _id nor PTIN found on property");
    }

    if (!updatedProperty) {
      throw new Error("Property not found in database");
    }

    console.log(
      "Property flagged for receipt generation:",
      updatedProperty._id.toString() , " with PTIN : " , updatedProperty?.PTIN
    );

    return updatedProperty;

  } catch (err) {
	console.log("[ERROR] flagging property with Id : " , property?._id)
    console.error(
      "[ERROR] in flagPropertyForReceiptGen:",
      err.message
    );
	throw err
  }
};
