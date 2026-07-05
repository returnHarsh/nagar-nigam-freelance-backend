import { Property } from "../models/property.js";
import { User } from "../models/user.js";
import { errorLogger } from "../utils/errorLogger.js";
import mongoose from "mongoose"

export const getAllSystemUsers = async(req , res)=>{
	try{
		const users = await User.find({}).lean();

		return res.status(200).json({succes : true , message : "All system users fetched successfully" , data : users })

	}catch(err){
		console.log("[ERROR] in getAllSystemUsers : " , err.message);
		return res.status(501).json({succes : false , message : err.message});
	}
}


const totalDocs = async(query = {} , Collection)=>{
  try{

    const totalDocsCount = await Collection.countDocuments(query);
    return totalDocsCount

  }catch(err){
    console.log("[ERROR] in totalDocs : " , err.message);
  }
}

// ===================== Properties ====================
export const getProperties = async (req, res) => {
  try {
    let { limit, cursor } = req.query;
    const filterQueryFields = req.body


    let filterQuery = {}

    if(filterQueryFields){
      filterQuery = builFilterQuery(filterQueryFields);
    }
    console.log("filter query is : " , filterQuery)

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

    const total = await totalDocs({...query , ...filterQuery} , Property)

    // Fetch one extra document to determine if another page exists
    const properties = await Property.find({...query , ...filterQuery})
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
          totalDocsCount : total,
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

const builFilterQuery = (queryField)=>{
  const {ownerName , phoneNumber , fatherName , PTIN , wardNumber , ward} = queryField;
  const query = {}

  if(ownerName) query.ownerName = { $regex: ownerName,  $options: "i" };
  if(phoneNumber) query.phoneNumber = { $regex: phoneNumber,  $options: "i" };
  if(fatherName) query.fatherName = { $regex: fatherName,  $options: "i" };
  if(PTIN) query.PTIN = PTIN;
  if(wardNumber) query.wardNumber = wardNumber;
  if(ward) query.ward = ward;

  return query;

}

export const filterProperties = async(req,res)=>{
  try{
    
    const filterOptions = req.body;
    const query = builFilterQuery(filterOptions);

    const filteredProperties = await Property.find(query);

    return res.status(200).json({succes : true , message : "Properties fetched successfully" , data : filterProperties});

  }catch(err){
    console.log('[ERRPR] in filterProperties : '  , err.message);
    return res.status(500).json({succes : false , message : err.message});
  }
}