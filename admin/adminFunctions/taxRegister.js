import { NagarNigamProperty } from "../../models/nagarNigamProperty.js";
import { Property } from "../../models/property.js";
import { Tax } from "../../models/tax.js";
import { errorLogger } from "../../utils/errorLogger.js"



/**
 * 
 */


/**
 * Gets the current financial year (Viti Varsh) date range
 * Financial Year runs from April 1 to March 31
 * @returns {Object} { startDate, endDate, fiscalYear }
 */
const getVitiVarsh = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed (0=Jan, 3=April)

    const startDate = new Date();
    const endDate = new Date();

    // Check if we're currently in or after April
    if (currentMonth >= 3) { // April (3) or later
        // Financial year: April current year to March next year
        startDate.setFullYear(currentYear);
        startDate.setMonth(3); // April (0-indexed)
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        endDate.setFullYear(currentYear + 1);
        endDate.setMonth(2); // March (0-indexed)
        endDate.setDate(31);
        endDate.setHours(23, 59, 59, 999);
    } else {
        // We're in Jan-March, so financial year started last year
        startDate.setFullYear(currentYear - 1);
        startDate.setMonth(3); // April (0-indexed)
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        endDate.setFullYear(currentYear);
        endDate.setMonth(2); // March (0-indexed)
        endDate.setDate(31);
        endDate.setHours(23, 59, 59, 999);
    }

    // Format fiscal year string (e.g., "2024-2025")
    const fiscalYear = `${startDate.getFullYear()}-${endDate.getFullYear()}`;

    return {
        startDate,
        endDate,
        fiscalYear
    };
}

export const createTaxModel = async (taxDetail, property , arv , session) => {
    try {

        console.log("INSIDE THE CALCULATE TAX MODEL FUNCTION")
        console.log("TAX DETAILS : ", taxDetail);
        console.log("PROPERTY : ", property)

        // first we have to find if the tax if already register for that property;
        const prevTax = (await Tax.findOne({ propertyId: property?._id }).sort({ createdAt: -1 }).session(session))?.toObject();

        console.log("PREVIOUS TAX IS : " , prevTax)

        // creating a new Tax schema for this property
        const totalTax =  taxDetail?.totalTax

        const totalArv =  (taxDetail.breakdown.arv.totalResidentialARV + taxDetail.breakdown.arv.totalCommercialARV)
        const { startDate, endDate } = getVitiVarsh()

        if (prevTax) {
            console.log("PREVIOUS TAX FOUND!!")
            const tax = new Tax({
                propertyId : prevTax?.propertyId,
                arv : totalArv,
                totalTax : totalTax,
                taxStatus : prevTax?.taxStatus,
                paidAmount : prevTax?.paidAmount,
                taxBreakdown : taxDetail,
                effectiveFrom : prevTax?.startDate,
                dueDate : prevTax?.endDate,
                history : prevTax?.history,
                prevTaxPointer : prevTax?._id
                // dueAmount : totalTax - prevTax.paidAmount,
            })
            console.log("NEW TAX SAVED IS : " , tax)

            await tax.save({session});
            console.log("AFTER SAVING NEW TAX IS : " , tax)

            await Property.findByIdAndUpdate(property?._id , {tax : tax?._id});

            return tax;

        } else {
            console.log("NO NEW TAX FOUND!!")

            // ========== fetching the data we got from nagar nigam ===================
            const preNagarNigamData = await NagarNigamProperty.findOne({ownerName : property.ownerName , fatherName : property.fatherName , houseNumber : property.houseNumber}).session(session)
            console.log("NAGAR NIGAM DATA : " , preNagarNigamData);
            const bakaya = isNaN(Number(preNagarNigamData?.prevTax)) ? 0 : Number(preNagarNigamData?.prevTax)
            preNagarNigamData.PTIN = property.PTIN;
            preNagarNigamData.propertyId = property._id;
            await preNagarNigamData.save({session})


            // =================== First Time Creating The Tax Document For This Property ====================
            const tax = new Tax({
                propertyId: property?._id,
                arv: totalArv,
                totalTax : totalTax + bakaya,
                taxStatus: "pending",
                dueAmount: totalTax + bakaya,
                paidAmount: 0,
                taxBreakdown: taxDetail,
                effectiveFrom: startDate,
                dueDate: endDate,
                history: [],
                prevTaxPointer: null,
            })
            await tax.save({session});
            await Property.findByIdAndUpdate(property?._id , {tax : tax?._id});
            return tax;

        }




    } catch (err) {
        errorLogger(err, "createTaxModel");
    }
}