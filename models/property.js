import mongoose, { set } from "mongoose";
import {PropertyType , ConstructionType , RoadWidthType} from "../data/constants.js"
import { customAlphabet } from "nanoid"
import { errorLogger } from "../utils/errorLogger.js";

// ---------------- Floor Schema ----------------
const floorSchema = new mongoose.Schema({
  classification: {
    type: String,
    enum: ["residential", "commercial", "mixed"],
    required: true
  },
  carpetAreaC: { type: Number , set : v=> v === '' ? null : Number(v) },
  emptyAreaC: { type: Number ,  set : v=> v === '' ? null : Number(v) },
  carpetAreaR: { type: Number ,  set : v=> v === '' ? null : Number(v) },
  emptyAreaR: { type: Number ,  set : v=> v === '' ? null : Number(v) }
}, { _id: false });

// ---------------- Floors Wrapper ----------------
const floorsDataSchema = new mongoose.Schema({
  numberOfFloors: {
    type: Number,
    min: [1, "Number of floors must be at least 1"],
    required: true
  },
  floors: {
    type: [floorSchema],
    validate: {
      validator: function (value) {
        return value.length === this.numberOfFloors;
      },
      message: "Floors array length must match numberOfFloors"
    }
  }
}, { _id: false });

// ---------------- Family Members ----------------
const familySchema = new mongoose.Schema({
  male: { type: Number, default: 0 },
  female: { type: Number, default: 0 }
}, { _id: false });

// ---------------- Utilities ----------------
const utilitiesSchema = new mongoose.Schema({
  isTenantAvailable: { type: Boolean, default: false },
  isWaterConnection: { type: Boolean, default: false },
  isSubmersiblePump: { type: Boolean, default: false },
  isSewerConnection: { type: Boolean, default: false },
  doorToDoor : {type : Boolean , default : false}
}, { _id: false });

// ---------------- Surroundings ----------------
const surroundingSchema = new mongoose.Schema({
  east: { type: String, trim: true },
  west: { type: String, trim: true },
  north: { type: String, trim: true },
  south: { type: String, trim: true }
}, { _id: false });

// ---------------- Main Property Schema ----------------
const propertySchema = new mongoose.Schema({

  PTIN : {type : String , trim : true},
  ward: { type: String, trim: true , required : true},
  wardNumber : {type : String ,  required : true},
  locality: { type: String, trim: true , required : true},
  houseNumber: { type: String, trim: true ,  required : true},
  isEmptyProperty: { type: Boolean, default: false },
  districtCode : {type : String , required : true},

  // Interview & ownership
  interviewerName: { type: String, trim: true , required : true},
  fatherName: { type: String, trim: true },
  relationWithOwner: {
    type: String,
    enum: ["son", "daughter", "father", "mother", "sister", "wife", "brother", "others"]
  },
  ownerName: { type: String, trim: true },
  guardianName: { type: String, trim: true },
  phoneNumber : {type : Number , required : true},

  // Property info
  constructionYear: { type: Number },
  pinCode: { type: Number , required : true },
  address: { type: String, trim: true , required : true},
  religion: { type: String, enum: ["Hindu", "Muslim", "Christian", "Others"] },
  gender: { type: String, enum: ["male", "female", "others"] },
  // mobile: { type: Number },
  aadharNumber: { type: Number },
  propertyName: { type: String, trim: true },
  sequenceNumber: { type: Number },
  email : {type : String , trim : true},

  propertyClass : {type : String , enum : ["Residential" , "Commercial" , "Mixed"] , required : true},
  propertyType: { type: String, trim: true, enum: Object.values(PropertyType) , required : true , required : true},
  constructionType: { type: String, trim: true, enum: Object.values(ConstructionType) , required : true , required : true},
  roadWidthType: { type: String, trim: true, enum: Object.values(RoadWidthType) , required : true , required : true},

  numberOfToilets: { type: Number, default: 0 },

  // Sub-documents
  addFamilyMembers: { type: familySchema },
  utilities: { type: utilitiesSchema },
  waterConnectionNumber: { type: Number },
  surrounding: { type: surroundingSchema },
  floorsData: { type: floorsDataSchema , required : true },
  location: {
    type: {
      lattitude: { type: String },
      longitude: { type: String }
    },
    _id: false
  },

  receiptWithSign: { type: String },
  ownerInterviewer: { type: String },
  IDProof: { type: String },
  houseFrontWithNamePlate: { type: String },

  isSurveyVerified: { type: Boolean , default : false},
  surveyor: { type: mongoose.Schema.Types.ObjectId, ref: 'Surveyor' , required : true },

  propertyGroup : {type : String , enum : ["governmentOffices" , "schoolsAndColleges" , "hospitalsAndClinics" , "parksAndRecreation" , "transportHubs" , "localShops"]},

  editProof : {
    type : {
      message : {type : String},
      documentProof : {type : String},
      _id : false
    }
  },

  latestBillUrl : {type : String},
  lastBillGeneratedAt : {type : Date},

  tax : {type : mongoose.Schema.Types.ObjectId , ref : 'Tax'}

}, { timestamps: true, strict: false });


// Virtual field to choose email or fallback to phone
propertySchema.virtual("displayId").get(function () {
  return this.email || this.phoneNumber || this.PTIN;
});

// Make virtuals appear when converting document to JSON
propertySchema.set("toJSON", { virtuals: true });
propertySchema.set("toObject", { virtuals: true });


// to generate unique number
const generateNumericId = customAlphabet('0123456789', 6);

propertySchema.pre('save', function(next) {
  try {
    // Only generate PPIN for new documents
    if (this.isNew && !this.PTIN) {
      this.PTIN = `${this.districtCode}-${generateNumericId()}`;
    }
    next();
  } catch (err) {
    errorLogger(err, "pre-save hook on propertySchema");
    next(err);
  }
});
export const Property = mongoose.model("Property", propertySchema);
