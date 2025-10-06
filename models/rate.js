import mongoose from "mongoose";


const rateSchema = new mongoose.Schema({
	lessThan9m : {
		type : {
			permanentWithRccRbcRoof : {type : String , alias : "पक्का भवन / RCC या RBC छत सहित"},
			permanentWithAsbestosFiberTinShed : {type : String , alias : "अन्य पक्का भवन, ऐसबेस्टस / फाइबर या टीन शेड"},
			temporaryOrOtherBuilding : {type : String , alias : "कच्चा भवन या अन्य समस्त भवन"},
			plot : {type : String , alias : "भूखंड"}
		},
		alias : "9 मीटर से कम चौड़ी सड़क",
		_id : false
	},
	from9to12m :{
		type : {
			permanentWithRccRbcRoof : {type : String , alias : "पक्का भवन / RCC या RBC छत सहित"},
			permanentWithAsbestosFiberTinShed : {type : String , alias : "अन्य पक्का भवन, ऐसबेस्टस / फाइबर या टीन शेड"},
			temporaryOrOtherBuilding : {type : String , alias : "कच्चा भवन या अन्य समस्त भवन"},
			plot : {type : String , alias : "भूखंड"}
		},
		_id : false
	},
	from12to24m : {
		type : {
			permanentWithRccRbcRoof : {type : String , alias : "पक्का भवन / RCC या RBC छत सहित"},
			permanentWithAsbestosFiberTinShed : {type : String , alias : "अन्य पक्का भवन, ऐसबेस्टस / फाइबर या टीन शेड"},
			temporaryOrOtherBuilding : {type : String , alias : "कच्चा भवन या अन्य समस्त भवन"},
			plot : {type : String , alias : "भूखंड"}
		},
		_id : false
	},
	moreThan24m : {
		type : {
			permanentWithRccRbcRoof : {type : String , alias : "पक्का भवन / RCC या RBC छत सहित"},
			permanentWithAsbestosFiberTinShed : {type : String , alias : "अन्य पक्का भवन, ऐसबेस्टस / फाइबर या टीन शेड"},
			temporaryOrOtherBuilding : {type : String , alias : "कच्चा भवन या अन्य समस्त भवन"},
			plot : {type : String , alias : "भूखंड"}
		},
		_id : false
	}
	

} , {timestamps : true} )

export const Rate = mongoose.model("Rate" , rateSchema)