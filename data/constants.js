const PropertyType = {
  other: "अन्य",
  otherEstablishment: "अन्य प्रतिष्ठान",
  semiGovernmentOffice: "अर्धसरकारी कार्यालय",
  residenceAndClinic: "आवास और क्लिनिक",
  residenceAndShop: "आवास और दुकान",
  residenceAndMedicalStore: "आवास और मेडिकल स्टोर",
  building: "इमारत",
  atm: "एटीएम",
  office: "ऑफिस",
  industrialUnits: "औद्योगिक इकाईयां",
  sportsCenter: "क्रीड़ा केंद्र",
  club: "क्लब",
  welfareHall: "कल्याण मंडप",
  clinic: "क्लिनिक",
  factory: "कारखाना",
  coachingCenter: "कोचिंग",
  coalDepot: "कोल् डिपो",
  garage: "गैराज",
  gasWarehouseAgency: "गैस गोदाम/एजेंसी",
  warehouse: "गोदाम",
  cinemaHall: "चल्चित्र गह",
  fourStarAndAboveHotels: "चार सितारा और उसके ऊपर के होटल",
  hospital: "चिकित्सालय‌",
  hostel: "छात्रावास",
  gym: "जिम",
  tvTower: "टी.वी टावर",
  tower: "टॉवर",
  diagnosticCenter: "डायग्नोस्टिक केंद्र",
  upToThreeStarHotels: "तीन स्टार तक के होटल",
  theater: "थिएटर",
  shop: "दुकान",
  telecomTower: "दूरसंचार टावर",
  nursingHome: "नर्सिंग होम",
  privateHotel: "निजी होटल",
  petrolPump: "पेट्रोल पंप",
  pubs: "पब्स",
  laboratories: "प्रयोगशालाएं",
  privateLimitedCompany: "प्रा. लिमिटेड कंपनी",
  library: "पुस्तकालय",
  polyclinic: "पालीक्लिनिक",
  flat: "फ्लैट",
  bank: "बैंक",
  banquetHall: "बैंक्वेट हॉल",
  multiStoreyBuilding: "बहु मंजिला इमारत",
  multiStoreyCommercialEstablishment: "बहु मंजिला व्यवसायिक प्रतिष्ठान",
  bar: "बार",
  plot: "भूखंड",
  medicalStore: "मेडिकल स्टोर",
  marriageHome: "मैरिज होम",
  multiplex: "मल्टीप्लेक्स",
  malls: "मॉल्स",
  residence: "वासगृह",
  marriageClub: "विवाह क्लब",
  liquorShopBeerBar: "शराब की दुकान / बियर बार",
  physicalHealthCenterEtc: "शारीरिक स्वास्थ्य केंद्र आदि",
  educationalInstitution: "शिक्षण संस्थान",
  governmentOffice: "सरकारी कार्यालय",
  governmentBuilding: "सरकारी भवन",
  governmentSchool: "सरकारी विद्यालय",
  healthCareCenter: "स्वस्थ परिचर्या केंद्र",
  hotel: "होटल",
  hotelBar: "होटल/बार",
  hotelRestaurant: "होटल/रेस्टोरेंट",
  hoarding: "होर्डिंग",
  taxExemptProperty: "कर-मुक्त संपत्ति" // for Tax mukt property
};

const MultiplierCommercial = {
  category1: {
    hostel: "छात्रावास",
    sportsCenter: "क्रीड़ा केंद्र",
    club: "क्लब",
    physicalHealthCenterEtc: "शारीरिक स्वास्थ्य केंद्र आदि",
    theater: "थिएटर",    // on hold
    cinemaHall: "चल्चित्र गह",
    shop: "दुकान",
    liquorShopBeerBar: "शराब की दुकान / बियर बार",
    gym: "जिम",
    welfareHall: "कल्याण मंडप",
    // hairDresser: "नाई / हेयर ड्रेसर" // ⚠️ not in 64 list, only in screenshot
  },

  category2: {
    medicalStore: "मेडिकल स्टोर",
    residenceAndMedicalStore: "आवास और मेडिकल स्टोर",
    multiStoreyCommercialEstablishment: "बहु मंजिला व्यवसायिक प्रतिष्ठान",
    privateLimitedCompany: "प्रा. लिमिटेड कंपनी",
    // governmentCoaching: "सरकारी कोचिंग सेंटर" // ⚠️ not in 64 list
  },

  category3: {
    governmentOffice: "सरकारी कार्यालय",
    semiGovernmentOffice: "अर्धसरकारी कार्यालय",
    office: "ऑफिस",
    hospital: "चिकित्सालय‌",
    nursingHome: "नर्सिंग होम",
    diagnosticCenter: "डायग्नोस्टिक केंद्र",
    laboratories: "प्रयोगशालाएं",
    polyclinic: "पालीक्लिनिक",
    coachingCenter: "कोचिंग",
    industrialUnits: "औद्योगिक इकाईयां",
    factory: "कारखाना",
    multiplex: "मल्टीप्लेक्स",
    malls: "मॉल्स",
    hotel: "होटल",
    upToThreeStarHotels: "तीन स्टार तक के होटल",
    fourStarAndAboveHotels: "चार सितारा और उसके ऊपर के होटल",
    hotelBar: "होटल/बार",
    hotelRestaurant: "होटल/रेस्टोरेंट",
    bar: "बार",
    pubs: "पब्स",
    banquetHall: "बैंक्वेट हॉल",
    marriageHome: "मैरिज होम",
    marriageClub: "विवाह क्लब",
    // welfareHall: "कल्याण मंडप", // ⚠️ already in category1
    tvTower: "टी.वी टावर",
    telecomTower: "दूरसंचार टावर",
    tower: "टॉवर",
    petrolPump: "पेट्रोल पंप",
    bank: "बैंक",
    garage: "गैराज",
    coalDepot: "कोल् डिपो",
    warehouse: "गोदाम",
    gasWarehouseAgency: "गैस गोदाम/एजेंसी"
  },

  category4: {
    other: "अन्य",
    otherEstablishment: "अन्य प्रतिष्ठान",
    residence: "वासगृह",
    residenceAndClinic: "आवास और क्लिनिक",
    residenceAndShop: "आवास और दुकान",
    building: "इमारत",
    multiStoreyBuilding: "बहु मंजिला इमारत",
    plot: "भूखंड",
    flat: "फ्लैट",
    governmentBuilding: "सरकारी भवन",
    governmentSchool: "सरकारी विद्यालय",
    library: "पुस्तकालय",
    educationalInstitution: "शिक्षण संस्थान",
    hoarding: "होर्डिंग"
  }
};


const ConstructionType = {
  permanentWithRccRbcRoof: "पक्का भवन / RCC या RBC छत सहित",
  permanentWithAsbestosFiberTinShed: "अन्य पक्का भवन, ऐसबेस्टस / फाइबर या टीन शेड",
  temporaryOrOtherBuilding: "कच्चा भवन या अन्य समस्त भवन",
  plot: "भूखंड"
};

const RoadWidthType = {
  lessThan9m: "9 मीटर से कम चौड़ी सड़क",
  from9to12m: "9 से 12 मीटर चौड़ी सड़क",
  from12to24m: "12 से 24 मीटर चौड़ी सड़क",
  moreThan24m: "24 मीटर से अधिक चौड़ी सड़क"
};


const PropertyTypeReverseMapping = Object.fromEntries(Object.entries(PropertyType).map(([key , value]) => [value , key]))

const ConstructionTypeReverseMapping = Object.fromEntries(Object.entries(ConstructionType).map(([key, value]) => [value , key]))

const RoadWidthTypeReverseMapping = Object.fromEntries(Object.entries(RoadWidthType).map(([key , value])=> [value , key] ))



const reserverTheObject = (object)=>{
  return Object.fromEntries(Object.entries(([key , value])=> [value , key] ))
}



const cleanString = (str = "") => 
  str
    .toString()
    .normalize()             // fixes accented / decomposed characters
    .replace(/\u00A0/g, ' ') // replaces non-breaking space with normal space
    .replace(/\s+/g, ' ')    // collapses multiple spaces
    .trim(); 


const getKeyByValue = (value , obj)=>{
  console.log("********* start value is : " , value)
	const block = Object.entries(obj).find((el)=> {
    console.log("********* el is : " , el);
    console.log("compared value is : " , value);

    console.log("\n");
    
    // console.log("earch char in value : " , [...value].forEach(v=> console.log(v)))
    // console.log("earch char in el's value : " , [...el[1]].forEach(v=> console.log(v)))

    console.log([...value].map(ch => ch.charCodeAt(0)));
    console.log([...el[1]].map(ch => ch.charCodeAt(0)));

    console.log("clean string of value : " , cleanString(value));
    console.log("clean string of el[1] : " , cleanString(el[1]));


  return  cleanString(el[1]) === cleanString(value)
  })
  console.log("block is : " , block)
	return block ? block[0] : null
}



export const classifiedGroups = {
  governmentOffices: [
    PropertyType.governmentOffice,
    PropertyType.governmentBuilding,
    PropertyType.semiGovernmentOffice,
    PropertyType.office
  ],
  schoolsAndColleges: [
    PropertyType.educationalInstitution,
    PropertyType.governmentSchool,
    PropertyType.coachingCenter,
    PropertyType.library,
    PropertyType.hostel
  ],
  hospitalsAndClinics: [
    PropertyType.hospital,
    PropertyType.clinic,
    PropertyType.nursingHome,
    PropertyType.polyclinic,
    PropertyType.residenceAndClinic,
    PropertyType.residenceAndMedicalStore,
    PropertyType.diagnosticCenter,
    PropertyType.healthCareCenter,
    PropertyType.medicalStore,
    PropertyType.physicalHealthCenterEtc
  ],
  parksAndRecreation: [
    PropertyType.sportsCenter,
    PropertyType.club,
    PropertyType.gym,
    PropertyType.welfareHall,
    PropertyType.theater,
    PropertyType.multiplex,
    PropertyType.banquetHall
  ],
  transportHubs: [
    PropertyType.coalDepot,
    PropertyType.garage,
    PropertyType.petrolPump,
    PropertyType.telecomTower,
    PropertyType.tvTower
  ],
  localShops: [
    PropertyType.shop,
    PropertyType.residenceAndShop,
    PropertyType.atm,
    PropertyType.bank,
    PropertyType.pubs,
    PropertyType.bar,
    PropertyType.liquorShopBeerBar,
    PropertyType.hotel,
    PropertyType.hotelBar,
    PropertyType.hotelRestaurant,
    PropertyType.privateHotel,
    PropertyType.upToThreeStarHotels,
    PropertyType.fourStarAndAboveHotels,
    PropertyType.malls,
    PropertyType.multiplex
  ]
};



export {ConstructionType , PropertyType , getKeyByValue , PropertyTypeReverseMapping , ConstructionTypeReverseMapping , RoadWidthTypeReverseMapping , RoadWidthType , MultiplierCommercial , reserverTheObject}