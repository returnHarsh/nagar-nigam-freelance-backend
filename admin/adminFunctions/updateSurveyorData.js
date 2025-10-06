import Surveyor from "../../models/surveyor"
import { errorLogger, validatonError } from "../../utils/errorLogger"

export const updateSurveyourData = async(property , val)=>{
	try{

		// ============ update the surveyor data ================
		const surveyorId = property.surveyor
		if(!surveyorId) throw new validatonError({surveyor : {message : "Please select who is taking this survey"}})
		
		const surveyorDoc = await Surveyor.findById(surveyorId);

		// now we need to update the total successfull survery for this surveyor
		surveyorDoc.successfulSurveys += val;
		surveyorDoc.calculateSuccessRate();
		await surveyorDoc.save();
		
		

	}catch(err){
		errorLogger(err, "updateSurveyourData");
	}
}