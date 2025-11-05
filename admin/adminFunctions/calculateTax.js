// import { Rate } from "../models/rateModel.js"
// import { PropertyType , MultiplierCommercial, getKeyByValue, RoadWidthType, ConstructionType } from "./data.js"


// export const calculateRate = async(roadType , constructionType)=>{
// 	const rates = await Rate.findOne().sort({createdAt : -1})
// 	console.log("rates are : " , rates)
// 	console.log("roadtype" , roadType , "constructionType" , constructionType)
// 	return  {carpetRate : rates[roadType][constructionType] ,  emptyRate : rates[roadType]["plot"] }
// 	// return rates[roadType][constructionType] || null
// }

// export const getCommercialMultiplier = (propertyType)=>{
// 	const priceCategory = {
// 		category1 : 1,
// 		category2 : 2,
// 		category3 : 3,
// 		category4 : 3,
// 	}

// 	let category = Object.entries(MultiplierCommercial).find(([key , value])=>{
// 		const foundCategoryObj = Object.entries(value).find(([nestKey , nestValue])=> nestValue == propertyType);
// 		return foundCategoryObj
// 	})

// 	if(!category) category = "category4"

// 	return priceCategory[category[0]]

	

// }

// export const calculateTax = async(floorsData , roadType , constructionType , propertyType) => {

// 	if(!roadType || !constructionType || !propertyType ){
// 		throw new Error("please fill all the fields");
// 	}

// 	roadType = getKeyByValue(roadType , RoadWidthType)
// 	constructionType = getKeyByValue(constructionType , ConstructionType)

	

// 	console.log("roadType : " , roadType , " constructionType : " , constructionType)
// 	// return
// 	const { floors, numberOfFloors } = floorsData

// 	console.log("number of floors : " , floors)

// 	let totalEmptyR = 0;
// 	let totalEmptyC = 0;
// 	let totalCarpetR = 0;
// 	let totalCarpetC = 0;

// 	let index = 0;

// 	for (const floor of floors) {
// 		if (index >= numberOfFloors) break;
// 		totalEmptyR += floor.emptyAreaR
// 		totalEmptyC += floor.emptyAreaC
// 		totalCarpetR += floor.carpetAreaR
// 		totalCarpetC += floor.carpetAreaC

// 		console.log("index : " , index , " result : ")
// 		console.log("totalEmptyR =  " , totalEmptyR);
// 		console.log("totalEmptyC =  " , totalEmptyC);
// 		console.log("totalCarpetR =  " , totalCarpetR);
// 		console.log("totalCarpetC =  " , totalCarpetC);

// 		console.log("\n==========================================\n")

// 		index++;
// 	}

// 	// here we are calculating RATE on the basis of roadType and constructionType
// 	const {carpetRate : CARPET_RATE , emptyRate : EMPTY_RATE} = await calculateRate(roadType , constructionType)
// 	console.log("Carpet rate is : " , CARPET_RATE , "empty rate is : "  , EMPTY_RATE)

// 	// const COMMERCIAL_MULTIPLIER = 3
// 	// here we are calculating the multiplier for commercial area
// 	const COMMERCIAL_MULTIPLIER = getCommercialMultiplier(propertyType) 
// 	console.log("multiplier is : " , COMMERCIAL_MULTIPLIER)

// 	const emptyResARV = (EMPTY_RATE * totalEmptyR * 12)
// 	const emptyComARV = (EMPTY_RATE * totalEmptyC * 12) * COMMERCIAL_MULTIPLIER
// 	const carpetResARV = (CARPET_RATE * totalCarpetR * 12)
// 	const carpetComARV = (CARPET_RATE * totalCarpetC * 12) * COMMERCIAL_MULTIPLIER


// 	console.log("\n================ Final Total Areas  ==========================\n")
// 	console.log("final totalEmptyR =  " , totalEmptyR);
// 	console.log("final totalEmptyC =  " , totalEmptyC);
// 	console.log("final totalCarpetR =  " , totalCarpetR);
// 	console.log("final totalCarpetC =  " , totalCarpetC);

// 	console.log("\n==================== Final Total ARVs ======================\n")
// 	console.log("emptyResARV : " ,emptyResARV);
// 	console.log("emptyComARV : " ,emptyComARV);
// 	console.log("carpetResARV : " ,carpetResARV);
// 	console.log("carpetComARV : " ,carpetComARV);


// 	const totalARV = (emptyResARV + emptyComARV + carpetResARV + carpetComARV);

// 	const houseTaxInt = Math.round((10 / 100) * totalARV)
// 	const waterTaxInt = Math.round((7.5 / 100) * totalARV)

// 	console.log("total ARV is : " , totalARV )
// 	console.log("house tax is : ", houseTaxInt);
// 	console.log("water tax is : ", waterTaxInt);
// 	console.log("TOTAL TAX : ", houseTaxInt + waterTaxInt);

// 	const taxinfo = {
// 		houseTax : houseTaxInt,
// 		waterTax : waterTaxInt,
// 		totalTax : (houseTaxInt + waterTaxInt),
// 		totalARV,
// 		area : {
// 			"totalEmptyArea(R)" : totalEmptyR,
// 			"totalCarpetArea(R)" : totalCarpetR,
// 			"totalEmptyArea(C)" : totalEmptyC,
// 			"totalCarpetArea(C)" : totalCarpetC
// 		},
// 		arv : {
// 			emptyResARV,
// 			carpetResARV,
// 			emptyComARV,
// 			carpetComARV,
// 			totalARV
// 		}

// 	}

// 	return {houseTax : houseTaxInt , waterTax : waterTaxInt , totalTax : (houseTaxInt + waterTaxInt) , totalARV, taxinfo}
// }






import { errorLogger } from "../../utils/errorLogger.js"
import { Rate } from "../../models/rate.js"
import { PropertyType, MultiplierCommercial, getKeyByValue, RoadWidthType, ConstructionType } from "../../data/constants.js"

/**
 * Calculates the rate based on road type and construction type
 * @param {string} roadType - Type of road (e.g., "road20", "road40")
 * @param {string} constructionType - Type of construction (e.g., "rcc", "semi_permanent")
 * @returns {Promise<{carpetRate: number, emptyRate: number}>}
 * @throws {Error} If rates not found or invalid parameters
 */
export const calculateRate = async (roadType, constructionType) => {
	// Fetch the latest rate configuration
	const rates = await Rate.findOne().sort({ createdAt: -1 })
	
	if (!rates) {
		throw new Error('No rate configuration found in database')
	}
	
	// Validate roadType exists
	if (!rates[roadType]) {
		throw new Error(`Invalid road type: ${roadType}. Available types: ${Object.keys(rates).join(', ')}`)
	}
	
	// Validate constructionType exists
	if (!rates[roadType][constructionType]) {
		throw new Error(`Invalid construction type: ${constructionType} for road type: ${roadType}`)
	}
	
	// Validate plot rate exists
	if (!rates[roadType]["plot"]) {
		throw new Error(`Plot rate not found for road type: ${roadType}`)
	}
	
	console.log("Rates fetched:", { roadType, constructionType, carpetRate: rates[roadType][constructionType], emptyRate: rates[roadType]["plot"] })
	
	return {
		carpetRate: rates[roadType][constructionType],
		emptyRate: rates[roadType]["plot"]
	}
}

/**
 * Gets the commercial multiplier based on property type
 * @param {string} propertyType - Type of property
 * @returns {number} Multiplier value (1, 2, or 3)
 */
export const getCommercialMultiplier = (propertyType) => {
	const priceCategory = {
		category1: 1,
		category2: 2,
		category3: 3,
		category4: 3,
	}

	// Find which category the property type belongs to
	let category = Object.entries(MultiplierCommercial).find(([key, value]) => {
		return Object.values(value).includes(propertyType);
	})

	// Default to category4 if property type not found
	const categoryKey = category ? category[0] : 'category4';
	
	const multiplier = priceCategory[categoryKey];
	console.log(`Property type: ${propertyType} -> Category: ${categoryKey} -> Multiplier: ${multiplier}`)
	
	return multiplier;
}

/**
 * Validates floor data structure
 * @param {Object} floorsData - Floor data object
 * @throws {Error} If validation fails
 */
const validateFloorsData = (floorsData) => {
	if (!floorsData) {
		throw new Error('Floors data is required')
	}
	
	if (!floorsData.floors || !Array.isArray(floorsData.floors)) {
		throw new Error('Floors data must contain a "floors" array')
	}
	
	if (typeof floorsData.numberOfFloors !== 'number' || floorsData.numberOfFloors < 0) {
		throw new Error('Invalid numberOfFloors value')
	}
	
	// Validate each floor has required properties
	floorsData.floors.forEach((floor, index) => {
		const requiredFields = ['emptyAreaR', 'emptyAreaC', 'carpetAreaR', 'carpetAreaC'];
		requiredFields.forEach(field => {
			if (typeof floor[field] !== 'number' || floor[field] < 0) {
				throw new Error(`Floor ${index}: ${field} must be a non-negative number`)
			}
		})
	})
}

/**
 * Calculates total areas from floor data
 * @param {Array} floors - Array of floor objects
 * @param {number} numberOfFloors - Number of floors to process
 * @returns {Object} Total areas for each category
 */
const calculateTotalAreas = (floors, numberOfFloors) => {
	let totalEmptyR = 0;
	let totalEmptyC = 0;
	let totalCarpetR = 0;
	let totalCarpetC = 0;

	for (let i = 0; i < Math.min(numberOfFloors, floors.length); i++) {
		const floor = floors[i];
		totalEmptyR += floor.emptyAreaR;
		totalEmptyC += floor.emptyAreaC;
		totalCarpetR += floor.carpetAreaR;
		totalCarpetC += floor.carpetAreaC;

		console.log(`Floor ${i}:`, {
			emptyR: floor.emptyAreaR,
			emptyC: floor.emptyAreaC,
			carpetR: floor.carpetAreaR,
			carpetC: floor.carpetAreaC
		})
	}

	console.log("\n================ Total Areas ==========================")
	console.log("Total Empty Area (Residential):", totalEmptyR);
	console.log("Total Empty Area (Commercial):", totalEmptyC);
	console.log("Total Carpet Area (Residential):", totalCarpetR);
	console.log("Total Carpet Area (Commercial):", totalCarpetC);

	return { totalEmptyR, totalEmptyC, totalCarpetR, totalCarpetC };
}

/**
 * Calculates ARV (Annual Rental Value) for all categories
 * @param {Object} areas - Total areas object
 * @param {number} carpetRate - Rate for carpet area
 * @param {number} emptyRate - Rate for empty/plot area
 * @param {number} commercialMultiplier - Multiplier for commercial areas
 * @returns {Object} ARV breakdown
 */
const calculateARV = (areas, carpetRate, emptyRate, commercialMultiplier) => {
	const { totalEmptyR, totalEmptyC, totalCarpetR, totalCarpetC } = areas;

	// Calculate ARV for each category
	// Formula: Area × Rate × 12 months (× Commercial Multiplier for commercial)
	const emptyResARV = totalEmptyR * emptyRate * 12;
	const emptyComARV = totalEmptyC * emptyRate * 12 * commercialMultiplier;
	const carpetResARV = totalCarpetR * carpetRate * 12;
	const carpetComARV = totalCarpetC * carpetRate * 12 * commercialMultiplier;

	const totalARV = emptyResARV + emptyComARV + carpetResARV + carpetComARV;

	console.log("\n==================== ARV Breakdown ======================")
	console.log("Empty Residential ARV:", emptyResARV);
	console.log("Empty Commercial ARV:", emptyComARV);
	console.log("Carpet Residential ARV:", carpetResARV);
	console.log("Carpet Commercial ARV:", carpetComARV);
	console.log("Total ARV:", totalARV);

	return {
		emptyResARV,
		emptyComARV,
		carpetResARV,
		carpetComARV,
		totalARV
	};
}

/**
 * Calculates house tax and water tax
 * @param {number} totalARV - Total Annual Rental Value
 * @returns {Object} Tax breakdown
 */
export const calculateTaxes = (totalARV) => {
	// House Tax: 10% of ARV
	// Water Tax: 7.5% of ARV
	const houseTax = Math.round((10 / 100) * totalARV);
	const waterTax = Math.round((7.5 / 100) * totalARV);
	const totalTax = houseTax + waterTax;

	console.log("\n==================== Tax Calculation ======================")
	console.log("House Tax (10%):", houseTax);
	console.log("Water Tax (7.5%):", waterTax);
	console.log("Total Tax:", totalTax);

	return { houseTax, waterTax, totalTax };
}

/**
 * Main function to calculate property tax
 * @param {Object} floorsData - Floor data with areas
 * @param {string} roadType - Type of road (from RoadWidthType enum)
 * @param {string} constructionType - Type of construction (from ConstructionType enum)
 * @param {string} propertyType - Type of property (from PropertyType enum)
 * @returns {Promise<Object>} Complete tax calculation result
 * @throws {Error} If validation fails or calculation error occurs
 */
export const calculateTax = async (floorsData, roadType, constructionType, propertyType) => {
	try {
		console.log("\n============== Starting Tax Calculation ==============")
		console.log("Input Parameters:", { roadType, constructionType, propertyType })

		// Validate input parameters
		if (!roadType || !constructionType || !propertyType) {
			throw new Error('Missing required parameters: roadType, constructionType, and propertyType are required')
		}

		// Validate floors data
		validateFloorsData(floorsData);

		// Convert enum values to keys
		const roadTypeKey = getKeyByValue(roadType, RoadWidthType);
		const constructionTypeKey = getKeyByValue(constructionType, ConstructionType);

		if (!roadTypeKey || !constructionTypeKey) {
			console.log("roadtype key is : " , roadTypeKey)
			console.log("construction type key is : " , constructionTypeKey)
			throw new Error(`Invalid roadType or constructionType. Road: ${roadType}, Construction: ${constructionType}`)
		}

		console.log("Converted Keys:", { roadTypeKey, constructionTypeKey })

		const { floors, numberOfFloors } = floorsData;

		// Step 1: Calculate total areas
		const areas = calculateTotalAreas(floors, numberOfFloors);

		// Step 2: Get rates from database
		const { carpetRate, emptyRate } = await calculateRate(roadTypeKey, constructionTypeKey);

		// Step 3: Get commercial multiplier
		// let commercialMultiplier = getCommercialMultiplier(propertyType)
		// if (commercialMultiplier < 3 && areas.totalCarpetR > 120) {
		// 	commercialMultiplier = 3;
		// }

		// =============== now for karhal the commercialMultiplier should be hardcoded to 3 ===================
		const commercialMultiplier = 3;

		// Step 4: Calculate ARV
		const arvBreakdown = calculateARV(areas, carpetRate, emptyRate, commercialMultiplier);

		// Step 5: Calculate taxes
		const taxes = calculateTaxes(arvBreakdown.totalARV);

		console.log("\n============== Tax Calculation Complete ==============\n")

		// Return comprehensive result
		return {
			// Primary tax values
			houseTax: taxes.houseTax,
			waterTax: taxes.waterTax,
			totalTax: taxes.totalTax,
			
			// Detailed breakdown
			breakdown: {
				totalARV: arvBreakdown.totalARV,
				
				// Area breakdown
				areas: {
					residential: {
						empty: areas.totalEmptyR,
						carpet: areas.totalCarpetR,
						total: areas.totalEmptyR + areas.totalCarpetR
					},
					commercial: {
						empty: areas.totalEmptyC,
						carpet: areas.totalCarpetC,
						total: areas.totalEmptyC + areas.totalCarpetC
					},
					grandTotal: areas.totalEmptyR + areas.totalCarpetR + areas.totalEmptyC + areas.totalCarpetC
				},
				
				// ARV breakdown
				arv: {
					emptyResidentialARV: arvBreakdown.emptyResARV,
					carpetResidentialARV: arvBreakdown.carpetResARV,
					emptyCommercialARV: arvBreakdown.emptyComARV,
					carpetCommercialARV: arvBreakdown.carpetComARV,
					totalResidentialARV: arvBreakdown.emptyResARV + arvBreakdown.carpetResARV,
					totalCommercialARV: arvBreakdown.emptyComARV + arvBreakdown.carpetComARV
				},
				
				// Rates used in calculation
				rates: {
					carpetRate,
					emptyRate,
					commercialMultiplier,
					houseTaxRate: 10, // percentage
					waterTaxRate: 7.5  // percentage
				},
				
				// Input parameters for reference
				parameters: {
					roadType: roadTypeKey,
					constructionType: constructionTypeKey,
					propertyType,
					numberOfFloors
				}
			}
		};

	} catch (error) {
		console.error("Tax Calculation Error:", error.message);
		errorLogger(error , "calculateTax");
	}
}