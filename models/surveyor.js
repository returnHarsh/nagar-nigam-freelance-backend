import mongoose from "mongoose";
import { customAlphabet } from "nanoid";
import { errorLogger } from "../utils/errorLogger.js";

const surveyorSchema = new mongoose.Schema({
  surveyorCode: { type: String },
  name: { type: String },
  email: { type: String },
  lastSurveyDate: { type: Date },
  totalSurveys: { type: Number, default: 0 },
  successfulSurveys: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

// method/function attached to every object created by this schema
surveyorSchema.methods.calculateSuccessRate = function(){
	try{
		if(this.totalSurveys > 0){
			this.successRate = Math.floor((this.successfulSurveys / this.totalSurveys)*100)
		}else{
			this.successRate = 0;
		}

	}catch(err){
		errorLogger(err , "calculateSuccessRate");
	}
}


// Create a generator for 6-digit numeric IDs
const generateNumericId = customAlphabet('0123456789', 6);

// Pre-save hook to generate surveyorId only on first creation
surveyorSchema.pre('save', function(next) {
  try {
    if (this.isNew) {
      this.surveyorId = `SUR-${generateNumericId()}`;
    }
    next();
  } catch (err) {
    errorLogger(err, "pre-save surveyorId");
    next(err);
  }
});

const Surveyor = mongoose.model("Surveyor", surveyorSchema);

export default Surveyor;
