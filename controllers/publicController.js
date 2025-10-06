import { Property } from "../models/formModelV2.js";
import { classifiedGroups } from "../utils/data.js";

export const getLocations = async (req, res) => {
	try {

		// Fetch only properties with a valid propertyGroup and select necessary fields
		const properties = await Property.find({
			propertyGroup: { $exists: true, $ne: null }
		})
			.select("propertyGroup location propertyName -_id")
			.sort({ createdAt: -1 });

		const propertyGroups = Object.keys(classifiedGroups);
		const data = {};
		const ALL_LOCATIONS_KEY = "allLocations";

		// Initialize arrays
		data[ALL_LOCATIONS_KEY] = [];

		// Categorize properties by propertyGroup
		propertyGroups.forEach(group => {
			const groupProperties = properties.filter(p => p.propertyGroup === group);
			data[group] = groupProperties;
			data[ALL_LOCATIONS_KEY].push(...groupProperties); // add to "All Locations"
		});

		// Add one more field for all properties if needed
		// data["All Properties"] = [...properties]; // optional, if you want all properties regardless of group

		return res.status(200).json({
			success: true,
			message: "All properties fetched and categorized",
			data
		});

	} catch (err) {
		console.log("[ERROR] in getLocations function : ", err.message)
		return res.status(500).json({ success: false, message: "something went wrong" })
	}
}