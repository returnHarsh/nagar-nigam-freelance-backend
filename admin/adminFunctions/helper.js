import { classifiedGroups } from "../../data/constants.js";
import Surveyor from "../../models/surveyor.js";
import { errorLogger } from "../../utils/errorLogger.js";

export const buildFloorsData = (payload) => {
  // 	console.log("payload is : " , payload)
  // const floorsData = {
  //   numberOfFloors: Number(payload["floorsData.numberOfFloors"] || 0),
  //   floors: [],
  // };

  // for (let i = 0; i < floorsData.numberOfFloors; i++) {
  //   floorsData.floors.push({
  //     classification: payload[`floorsData.floors.${i}.classification`] || "",
  //     carpetAreaC: payload[`floorsData.floors.${i}.carpetAreaC`] || "",
  //     emptyAreaC: payload[`floorsData.floors.${i}.emptyAreaC`] || "",
  //     carpetAreaR: payload[`floorsData.floors.${i}.carpetAreaR`] || "",
  //     emptyAreaR: payload[`floorsData.floors.${i}.emptyAreaR`] || "",
  //   });
  // }

  // return floorsData;

  const floorsData = {};
  floorsData.numberOfFloors = Number(payload["floorsData.numberOfFloors"]) || 0;
  const NF = floorsData.numberOfFloors;
  const floors = [];

  for (let i = 0; i < NF; i++) {
    const iThFloor = {
      classification: payload[`floorsData.floors.${i}.classification`] || "",
      carpetAreaC: safeNumber(payload[`floorsData.floors.${i}.carpetAreaC`]),
      carpetAreaR: safeNumber(payload[`floorsData.floors.${i}.carpetAreaR`]),
      emptyAreaC: safeNumber(payload[`floorsData.floors.${i}.emptyAreaC`]),
      emptyAreaR: safeNumber(payload[`floorsData.floors.${i}.emptyAreaR`]),
    };
    floors.push(iThFloor);
  }

  floorsData.floors = floors;

  // helper function
  function safeNumber(value) {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  return floorsData;
};


export const createSurveyorDoc = async(user)=>{
	try{

		if(user.role !== "surveyor") return "Not Surveyor";

		// first lets check if this surveyour already exists or not
		const isSurveyorAlreadyExists = await Surveyor.findOne({ email : user.email , active : true});
		if(isSurveyorAlreadyExists) return "Surveyor already exists in Database"

		await Surveyor.create({
			name : user.name,
			email : user.email
		})

		return "New Surveyor is Created"

	}catch(err){
		errorLogger(err , "createSurveyorDoc");
	}
}



export const mapClassifiedProperty = (propertyType)=>{
	try{

		console.log("classified groups : " , classifiedGroups)
		console.log("property type is : " , propertyType)

		const res = Object.entries(classifiedGroups).find(([key , value])=>{
			return value.includes(propertyType.trim())
		})
		console.log("group is : " ,  res)
		return res ? res[0] : null

	}catch(err){
		flagError(err , "mapClassifiedProperty");
	}
}


export const buildOject = (flattenObject , property)=>{
	const obj = {}

	// console.log("property path is : " , property.path)

	Object.entries(flattenObject).map(( [key , value] )=>{

		if(key.startsWith(`${property.path}`)) obj[key.split(".")[1]] = value

	})

	// console.log("object is : " , obj)

	return obj
}


export const attachFullS3Link = async (doc, DB, keyField, fullS3Field) => {
  try {
    if (!doc[keyField]) return; // nothing to attach

    const latestDoc = await DB.findById(doc?._id);
    if (!latestDoc) return; // document not found

    const fullUrl = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${doc[keyField]}`;

    latestDoc[fullS3Field] = fullUrl;
    await latestDoc.save();

  } catch (err) {
    errorLogger(err, "attachFullS3Link");
  }
};
