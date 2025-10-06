import bcrypt from "bcrypt";
import { Property } from "../models/formModelV2.js";
import { ActivityLogs } from "../models/activityLogSchema.js";
import User from "../models/userModel.js";
import { generateAndSendToken } from "../auth/authUtils.js";
import { getDayRange } from "../utils/dateUtils.js";

const dashboardStats = async () => {
  const total = await Property.countDocuments({});

  const residential = await Property.aggregate([
    {
      $match: {
        "floorsData.floors.classification": "residential",
        $expr: {
          $not: { $in: ["commercial", "$floorsData.floors.classification"] },
        },
      },
    },
    { $count: "count" },
  ]);

  const nonResidential = await Property.aggregate([
    {
      $match: {
        "floorsData.floors.classification": "commercial",
        $expr: {
          $not: { $in: ["residential", "$floorsData.floors.classification"] },
        },
      },
    },
    { $count: "count" },
  ]);

  const mixed = await Property.aggregate([
    {
      $match: {
        $and: [
          { "floorsData.floors.classification": "residential" },
          { "floorsData.floors.classification": "commercial" },
        ],
      },
    },
    { $count: "count" },
  ]);

  const surveyStats = await Property.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        verified: { $sum: { $cond: ["$isSurveyVerified", 1, 0] } },
      },
    },
    {
      $project: {
        total: 1,
        verified: 1,
        verifiedPercent: {
          $multiply: [{ $divide: ["$verified", "$total"] }, 100],
        },
      },
    },
  ]);

  const verificationStats = await Property.aggregate([
    {
      $project: {
        verificationTime: {
          $divide: [
            { $subtract: ["$updatedAt", "$createdAt"] },
            1000 * 60 * 60,
          ],
        },
      },
    },
    { $group: { _id: null, avgVerification: { $avg: "$verificationTime" } } },
  ]);

  return {
    total,
    residential: residential[0]?.count || 0,
    nonResidential: nonResidential[0]?.count || 0,
    mixed: mixed[0]?.count || 0,
    surveyDone: surveyStats[0]?.verifiedPercent || 0,
    verificationWindow: verificationStats[0]?.avgVerification || 0,
  };
};

const inDepthDashboardAnalysis = async () => {
  try {
    const stats = await Property.aggregate([
      {
        $facet: {
          // ----------- TOTALS -----------
          totalProperties: [{ $count: "count" }],
          verifiedProperties: [
            { $match: { isSurveyVerified: true } },
            { $count: "count" },
          ],
          emptyProperties: [
            { $match: { isEmptyProperty: true } },
            { $count: "count" },
          ],

          // ----------- PROPERTY TYPES -----------
          byPropertyType: [
            {
              $group: {
                _id: "$propertyType",
                count: { $sum: 1 },
              },
            },
          ],
          byConstructionType: [
            {
              $group: {
                _id: "$constructionType",
                count: { $sum: 1 },
              },
            },
          ],
          byGender: [
            {
              $group: {
                _id: "$gender",
                count: { $sum: 1 },
              },
            },
          ],
          byReligion: [
            {
              $group: {
                _id: "$religion",
                count: { $sum: 1 },
              },
            },
          ],
          byWard: [
            {
              $group: {
                _id: "$ward",
                count: { $sum: 1 },
              },
            },
          ],

          // ----------- FAMILY & UTILITIES -----------
          familyStats: [
            {
              $group: {
                _id: null,
                totalMale: { $sum: "$addFamilyMembers.male" },
                totalFemale: { $sum: "$addFamilyMembers.female" },
              },
            },
          ],
          utilitiesStats: [
            {
              $group: {
                _id: null,
                waterConnection: {
                  $sum: { $cond: ["$utilities.isWaterConnection", 1, 0] },
                },
                sewerConnection: {
                  $sum: { $cond: ["$utilities.isSewerConnection", 1, 0] },
                },
                submersiblePump: {
                  $sum: { $cond: ["$utilities.isSubmersiblePump", 1, 0] },
                },
                tenantAvailable: {
                  $sum: { $cond: ["$utilities.isTenantAvailable", 1, 0] },
                },
              },
            },
          ],

          // ----------- FLOOR & AREA -----------
          floorStats: [
            { $unwind: "$floorsData.floors" },
            {
              $group: {
                _id: "$floorsData.floors.classification",
                totalCarpetArea: {
                  $sum: {
                    $add: [
                      { $ifNull: ["$floorsData.floors.carpetAreaC", 0] },
                      { $ifNull: ["$floorsData.floors.carpetAreaR", 0] },
                    ],
                  },
                },
                totalEmptyArea: {
                  $sum: {
                    $add: [
                      { $ifNull: ["$floorsData.floors.emptyAreaC", 0] },
                      { $ifNull: ["$floorsData.floors.emptyAreaR", 0] },
                    ],
                  },
                },
                count: { $sum: 1 },
              },
            },
            {
              $addFields: {
                avgCarpetArea: {
                  $divide: ["$totalCarpetArea", "$count"],
                },
                avgEmptyArea: {
                  $divide: ["$totalEmptyArea", "$count"],
                },
              },
            },
          ],

          numberOfFloorsStats: [
            {
              $group: {
                _id: "$floorsData.numberOfFloors",
                count: { $sum: 1 },
              },
            },
          ],

          toiletsStats: [
            {
              $group: {
                _id: null,
                totalToilets: { $sum: "$numberOfToilets" },
                avgToilets: { $avg: "$numberOfToilets" },
              },
            },
          ],

          constructionYearStats: [
            {
              $group: {
                _id: null,
                minYear: { $min: "$constructionYear" },
                maxYear: { $max: "$constructionYear" },
                avgYear: { $avg: "$constructionYear" },
              },
            },
          ],

          // ----------- SURVEYOR PERFORMANCE -----------
          surveyorStats: [
            {
              $group: {
                _id: "$surveyor",
                totalSurveys: { $sum: 1 },
                verifiedSurveys: {
                  $sum: { $cond: ["$isSurveyVerified", 1, 0] },
                },
              },
            },
            // Lookup surveyor names
            {
              $lookup: {
                from: "surveyors",
                localField: "_id",
                foreignField: "_id",
                as: "surveyorInfo",
              },
            },
            {
              $unwind: {
                path: "$surveyorInfo",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                surveyorName: "$surveyorInfo.name",
                verifiedPercentage: {
                  $cond: [
                    { $eq: ["$totalSurveys", 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ["$verifiedSurveys", "$totalSurveys"] },
                        100,
                      ],
                    },
                  ],
                },
              },
            },
            { $project: { surveyorInfo: 0 } },
          ],
        },
      },
      // ----------- CALCULATE PERCENTAGES -----------
      {
        $project: {
          totalProperties: { $arrayElemAt: ["$totalProperties.count", 0] },
          verifiedProperties: {
            $arrayElemAt: ["$verifiedProperties.count", 0],
          },
          emptyProperties: { $arrayElemAt: ["$emptyProperties.count", 0] },

          byPropertyType: {
            $map: {
              input: "$byPropertyType",
              as: "item",
              in: {
                _id: "$$item._id",
                count: "$$item.count",
                percentage: {
                  $multiply: [
                    {
                      $divide: [
                        "$$item.count",
                        { $arrayElemAt: ["$totalProperties.count", 0] },
                      ],
                    },
                    100,
                  ],
                },
              },
            },
          },

          byConstructionType: {
            $map: {
              input: "$byConstructionType",
              as: "item",
              in: {
                _id: "$$item._id",
                count: "$$item.count",
                percentage: {
                  $multiply: [
                    {
                      $divide: [
                        "$$item.count",
                        { $arrayElemAt: ["$totalProperties.count", 0] },
                      ],
                    },
                    100,
                  ],
                },
              },
            },
          },

          byGender: {
            $map: {
              input: "$byGender",
              as: "item",
              in: {
                _id: "$$item._id",
                count: "$$item.count",
                percentage: {
                  $multiply: [
                    {
                      $divide: [
                        "$$item.count",
                        { $arrayElemAt: ["$totalProperties.count", 0] },
                      ],
                    },
                    100,
                  ],
                },
              },
            },
          },

          byReligion: {
            $map: {
              input: "$byReligion",
              as: "item",
              in: {
                _id: "$$item._id",
                count: "$$item.count",
                percentage: {
                  $multiply: [
                    {
                      $divide: [
                        "$$item.count",
                        { $arrayElemAt: ["$totalProperties.count", 0] },
                      ],
                    },
                    100,
                  ],
                },
              },
            },
          },

          byWard: {
            $map: {
              input: "$byWard",
              as: "item",
              in: {
                _id: "$$item._id",
                count: "$$item.count",
                percentage: {
                  $multiply: [
                    {
                      $divide: [
                        "$$item.count",
                        { $arrayElemAt: ["$totalProperties.count", 0] },
                      ],
                    },
                    100,
                  ],
                },
              },
            },
          },

          familyStats: { $arrayElemAt: ["$familyStats", 0] },
          utilitiesStats: {
            $let: {
              vars: { u: { $arrayElemAt: ["$utilitiesStats", 0] } },
              in: {
                waterConnection: "$$u.waterConnection",
                waterConnectionPercentage: {
                  $multiply: [
                    {
                      $divide: [
                        "$$u.waterConnection",
                        { $arrayElemAt: ["$totalProperties.count", 0] },
                      ],
                    },
                    100,
                  ],
                },
                sewerConnection: "$$u.sewerConnection",
                sewerConnectionPercentage: {
                  $multiply: [
                    {
                      $divide: [
                        "$$u.sewerConnection",
                        { $arrayElemAt: ["$totalProperties.count", 0] },
                      ],
                    },
                    100,
                  ],
                },
                submersiblePump: "$$u.submersiblePump",
                submersiblePumpPercentage: {
                  $multiply: [
                    {
                      $divide: [
                        "$$u.submersiblePump",
                        { $arrayElemAt: ["$totalProperties.count", 0] },
                      ],
                    },
                    100,
                  ],
                },
                tenantAvailable: "$$u.tenantAvailable",
                tenantAvailablePercentage: {
                  $multiply: [
                    {
                      $divide: [
                        "$$u.tenantAvailable",
                        { $arrayElemAt: ["$totalProperties.count", 0] },
                      ],
                    },
                    100,
                  ],
                },
              },
            },
          },

          floorStats: 1,
          numberOfFloorsStats: 1,
          toiletsStats: { $arrayElemAt: ["$toiletsStats", 0] },
          constructionYearStats: {
            $arrayElemAt: ["$constructionYearStats", 0],
          },
          surveyorStats: 1,
        },
      },
    ]);

    return stats[0];
  } catch (err) {
    console.error("Error fetching property stats:", err);
    return null;
  }
};

const countPropertiesUsingAggregation = async () => {
  try {
    const stats = await Property.aggregate([
      { $unwind: "$floorsData.floors" },
      {
        $group: {
          _id: "$_id",
          types: { $addToSet: "$floorsData.floors.classification" },
        },
      },
      {
        $group: {
          _id: null,
          totalResidentialProperty: {
            $sum: { $cond: [{ $eq: ["$types", ["residential"]] }, 1, 0] },
          },
          totalCommercialProperty: {
            $sum: { $cond: [{ $eq: ["$types", ["commercial"]] }, 1, 0] },
          },
          totalMixedProperty: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ["residential", "$types"] },
                    { $in: ["commercial", "$types"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);
  } catch (err) {
    console.log("[ERROR] in countPropertiesUsingAggregation ", err.message);
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const properties = await Property.find({})
      .select("floorsData.floors.classification -_id")
      .lean();

    const totalProperties = properties.length;

    let residentialCount = 0;
    let commercialCount = 0;
    let mixedCount = 0;

    // Extract just the classifications per property
    const propertyClassifications = properties.map(
      (property) =>
        property.floorsData?.floors?.map((floor) => floor.classification) || []
    );

    // Classify each property
    propertyClassifications.forEach((classifications) => {
      const hasResidential = classifications.includes("residential");
      const hasCommercial = classifications.includes("commercial");

      if (hasResidential && hasCommercial) {
        mixedCount += 1;
      } else if (hasCommercial) {
        commercialCount += 1;
      } else if (hasResidential) {
        residentialCount += 1;
      }
    });

    // Survey stats
    const surveyStats = (
      await Property.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            verified: { $sum: { $cond: ["$isSurveyVerified", 1, 0] } },
          },
        },
        {
          $project: {
            total: 1,
            verified: 1,
            verifiedPercent: {
              $round: [
                { $multiply: [{ $divide: ["$verified", "$total"] }, 100] },
                2, // rounds to 2 decimal places
              ],
            },
          },
        },
      ])
    )[0] || { total: 0, verified: 0, verifiedPercent: 0 };

    // Verification stats , this pipeline is calculating the average time for a property from being created to verfied
    const rawVerificationStats = (
      await Property.aggregate([
        {
          $project: {
            verificationTime: {
              $divide: [
                { $subtract: ["$updatedAt", "$createdAt"] },
                1000 * 60 * 60, // convert ms → hours
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgVerification: { $avg: "$verificationTime" },
          },
        },
      ])
    )[0] || { avgVerification: 0 };

    let formattedVerification;
    const avgHours = rawVerificationStats.avgVerification;

    if (avgHours < 1) {
      // less than 1 hour → show minutes
      const minutes = avgHours * 60;
      formattedVerification = `${minutes.toFixed(2)} minutes`;
    } else if (avgHours < 24) {
      // less than 24 hours → show hours
      formattedVerification = `${avgHours.toFixed(2)} hours`;
    } else if (avgHours < 24 * 7) {
      // less than 1 week → show days
      const days = avgHours / 24;
      formattedVerification = `${days.toFixed(2)} days`;
    } else {
      // 1 week or more → show weeks
      const weeks = avgHours / (24 * 7);
      formattedVerification = `${weeks.toFixed(2)} weeks`;
    }

    const verificationStats = {
      avgVerification: avgHours, // raw value in hours
      formattedVerification, // nicely formatted string
    };

    // here we are calculating the tax stats
    const tax = await Property.aggregate([
      {
        $group: {
          _id: null,
          totalTaxSum: {
            $sum: {
              $convert: {
                input: "$totalTax",
                to: "double",
                onError: 0, // if value is NaN or string
                onNull: 0, // if value is null
              },
            },
          },
          // totalTaxPaidSum: {
          //   $sum: {
          //     $convert: {
          //       input: "$totalTaxPaid",
          //       to: "double",
          //       onError: 0,
          //       onNull: 0,
          //     },
          //   },
          // },
        },
      },
    ]);

    console.log("tax is : " , tax)

    const taxStats = {
      totalTax: tax[0]?.totalTaxSum || 0,
      totalTaxPaid: tax[0]?.totalTaxPaidSum || 0,
    };

    taxStats["totalTaxLeft"] = taxStats.totalTax - taxStats.totalTaxPaid;

    const stats = {
      totalProperties,
      totalResidentialProperty: residentialCount,
      totalCommercialProperty: commercialCount,
      totalMixedProperty: mixedCount,
      surveyStats,
      verificationStats,
      taxStats,
    };

    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    console.error("[Error] in getDashboardStats:", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export const chartStatsDataInDepth = async (req, res) => {
  try {
    const wardStats = await Property.aggregate([
      // Step 1: Classify each property based on its floors
      {
        $addFields: {
          propertyClassification: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      {
                        $in: [
                          "residential",
                          "$floorsData.floors.classification",
                        ],
                      },
                      {
                        $in: [
                          "commercial",
                          "$floorsData.floors.classification",
                        ],
                      },
                    ],
                  },
                  then: "mixed",
                },
                {
                  case: {
                    $eq: [
                      { $size: "$floorsData.floors" },
                      {
                        $size: {
                          $filter: {
                            input: "$floorsData.floors",
                            cond: {
                              $eq: ["$$this.classification", "residential"],
                            },
                          },
                        },
                      },
                    ],
                  },
                  then: "residential",
                },
                {
                  case: {
                    $eq: [
                      { $size: "$floorsData.floors" },
                      {
                        $size: {
                          $filter: {
                            input: "$floorsData.floors",
                            cond: {
                              $eq: ["$$this.classification", "commercial"],
                            },
                          },
                        },
                      },
                    ],
                  },
                  then: "commercial",
                },
              ],
              default: "mixed",
            },
          },
        },
      },

      // Step 2: Group by ward
      {
        $group: {
          _id: "$ward",
          totalTaxPerWard: { $sum: "$totalTax" },

          // ✅ Updated gender logic: sum family members
          maleCount: { $sum: "$addFamilyMembers.male" },
          femaleCount: { $sum: "$addFamilyMembers.female" },

          propertyTypes: { $push: "$propertyType" },
          constructionTypes: { $push: "$constructionType" },
          roadWidthTypes: { $push: "$roadWidthType" },
          propertyClassifications: { $push: "$propertyClassification" },
        },
      },

      // Step 3: Convert arrays into counts per ward
      {
        $project: {
          _id: 0,
          ward: "$_id",
          totalTaxPerWard: 1,
          genderData: { male: "$maleCount", female: "$femaleCount" },

          propertyTypeData: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ["$propertyTypes"] },
                as: "type",
                in: {
                  k: "$$type",
                  v: {
                    $size: {
                      $filter: {
                        input: "$propertyTypes",
                        cond: { $eq: ["$$this", "$$type"] },
                      },
                    },
                  },
                },
              },
            },
          },

          constructionTypeData: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ["$constructionTypes"] },
                as: "type",
                in: {
                  k: "$$type",
                  v: {
                    $size: {
                      $filter: {
                        input: "$constructionTypes",
                        cond: { $eq: ["$$this", "$$type"] },
                      },
                    },
                  },
                },
              },
            },
          },

          roadWidthTypeData: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ["$roadWidthTypes"] },
                as: "type",
                in: {
                  k: "$$type",
                  v: {
                    $size: {
                      $filter: {
                        input: "$roadWidthTypes",
                        cond: { $eq: ["$$this", "$$type"] },
                      },
                    },
                  },
                },
              },
            },
          },

          perWardPropertyClassification: {
            residential: {
              $size: {
                $filter: {
                  input: "$propertyClassifications",
                  cond: { $eq: ["$$this", "residential"] },
                },
              },
            },
            commercial: {
              $size: {
                $filter: {
                  input: "$propertyClassifications",
                  cond: { $eq: ["$$this", "commercial"] },
                },
              },
            },
            mixed: {
              $size: {
                $filter: {
                  input: "$propertyClassifications",
                  cond: { $eq: ["$$this", "mixed"] },
                },
              },
            },
          },
        },
      },
    ]);

    return res.status(200).json({ success: true, data: wardStats });
  } catch (err) {
    console.error("[Error] in chartStatsDataInDepth:", err);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export const chartStatsData = async (req, res) => {
  try {
    const classificationOfProperty = await Property.aggregate([
      { $unwind: "$floorsData.floors" },
      {
        $group: {
          _id: "$_id",
          types: { $addToSet: "$floorsData.floors.classification" },
        },
      },
      {
        $group: {
          _id: null,
          totalResidentialProperty: {
            $sum: { $cond: [{ $eq: ["$types", ["residential"]] }, 1, 0] },
          },
          totalCommercialProperty: {
            $sum: { $cond: [{ $eq: ["$types", ["commercial"]] }, 1, 0] },
          },
          totalMixedProperty: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ["residential", "$types"] },
                    { $in: ["commercial", "$types"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalResidentialProperty: 1,
          totalCommercialProperty: 1,
          totalMixedProperty: 1,
          totalProperties: {
            $add: [
              "$totalResidentialProperty",
              "$totalCommercialProperty",
              "$totalMixedProperty",
            ],
          },
          residentialPercent: {
            $multiply: [
              {
                $divide: [
                  "$totalResidentialProperty",
                  {
                    $add: [
                      "$totalResidentialProperty",
                      "$totalCommercialProperty",
                      "$totalMixedProperty",
                    ],
                  },
                ],
              },
              100,
            ],
          },
          commercialPercent: {
            $multiply: [
              {
                $divide: [
                  "$totalCommercialProperty",
                  {
                    $add: [
                      "$totalResidentialProperty",
                      "$totalCommercialProperty",
                      "$totalMixedProperty",
                    ],
                  },
                ],
              },
              100,
            ],
          },
          mixedPercent: {
            $multiply: [
              {
                $divide: [
                  "$totalMixedProperty",
                  {
                    $add: [
                      "$totalResidentialProperty",
                      "$totalCommercialProperty",
                      "$totalMixedProperty",
                    ],
                  },
                ],
              },
              100,
            ],
          },
        },
      },
    ]);

    const taxPerWard = await Property.aggregate([
      {
        $group: {
          _id: "$ward", // group by ward field
          totalTaxPerWard: { $sum: "$totalTax" },
        },
      },
      {
        $project: {
          _id: 0,
          ward: "$_id",
          totalTax: "$totalTaxPerWard",
        },
      },
    ]);

    console.log("classificationOfProperty : ", classificationOfProperty);
    console.log("taxPerWard : ", taxPerWard);

    const chartStats = {
      totalPropertiesClassification: classificationOfProperty[0] || {},
      totalTaxPerWard: taxPerWard || {},
    };

    return res.status(200).json({
      success: true,
      message: "Fetched Graph Stats",
      data: chartStats,
    });
  } catch (err) {
    console.log("[ERROR] in chartStatsData : ", err.message);
    return res.status(500).json({success : false , message : err.message})
  }
};

export const getSurveyorDataForRecord = async (req, res) => {
  try {
    // const currentDate = toIST(new Date());
    const currentDate = new Date();
    console.log("current date in IST is : ", currentDate);

    // let {dayStart : currentDayStart , dayEnd : currentDateEnd} = getISTDayRange(currentDate , currentDate)
    // currentDayStart = toIST(currentDayStart)
    // currentDateEnd = toIST(currentDateEnd)

    let { dayStart: currentDateStart, dayEnd: currentDateEnd } = getDayRange(
      currentDate,
      currentDate
    );

    let { from = currentDateStart, to = currentDateEnd } = req.body;
    console.log("from is : ", from);
    console.log("to is : ", to);

    const surveyDoneByToday = await Property.find({
      createdAt: { $gte: from, $lte: to },
    })
      .populate("surveyor")
      .sort({ createdAt: -1 })
      .lean();

    const surveyors = surveyDoneByToday.map((doc) => {
      return {
        ...doc.surveyor,
        isSurveyVerified: doc.isSurveyVerified,
        address: doc.address,
        ward: doc.ward,
        houseNumber: doc.houseNumber,
        surveyDate: doc.createdAt,
      };
    });

    console.log(
      "Total survery done in given time : ",
      surveyDoneByToday.length
    );

    return res.status(200).json({
      success: true,
      message: "Fetched all Surveyor's data",
      data: { surveyDoneByToday, surveyors },
    });
  } catch (err) {
    console.log("[ERROR] in getSurveyorDataForRecord : " , err.message);
    return res.status(500).json({success : false , message : getSurveyorDataForRecord })
  }
};

export const getLatestSurveyActivities = async (req, res) => {
  try {
    const { selected, limit = 5 } = req.body;

    if (selected === "activities") {
      console.log("user selected the activities section");
      const activities = await ActivityLogs.find({})
        .select("-performedBy.id")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return res.status(201).json({
        success: true,
        message: `Fetched latest ${activities?.length} activities`,
        data: activities,
      });
    }

    const recentPropertiesAdded = await Property.find({})
      .select(
        "houseNumber interviewerName ward locality createdAt isSurveyVerified"
      )
      .populate("surveyor", "name email isSurveyorActive")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log("fetched the recent surveys data");

    return res.status(201).json({
      success: true,
      message: `Fetched latest ${recentPropertiesAdded?.length} recent property data`,
      data: recentPropertiesAdded,
    });
  } catch (err) {
    console.log("[ERROR] in getLatestSurveyActivities function:", err.message);
    return res.status(502).json({
      success: false,
      message: `[ERROR] in getLatestSurveyActivities function: ${err.message}`,
    });
  }
};

export const getTotalPropertiesByCategory = async (req, res) => {
  try {
    const properties = await Property.find({}).select("floorsDate totalTax");

    const residentialProperties = [],
      commercialProperties = [],
      mixedProperties = [];
  } catch (err) {
    return res.status(500).json({success : false , message : err.message})
  }
};

export const getUserData = async (req, res) => {
  try {
    const body = req.body;

    // at start deckare an empty object and store the query in it ,  building dynamic query
    // query = {};

    // Object.entries(body).forEach(([key, value]) => {
    //   if (typeof key == "string") {
    //     query[key] = { $regex: value, $options: "i" };
    //   } else {
    //     query[key] = value;
    //   }
    // });

    const query = Object.entries(body).filter(([key, value]) => {
      return value;
    });

    console.log("query is : ", query);

    const newQuery = [];

    query.forEach(([q, val]) => {
      newQuery.push({ [q]: val });
    });

    const userData = await Property.find({
      $or: newQuery,
    });

    return res
      .status(201)
      .json({ success: true, message: "Fetched Properties!!", userData });
  } catch (err) {
    console.log("[ERROR] in getUserData : " , err.message);
    return res.status(500).json({success : false , message : err.message})
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminUser = await User.findOne({ email });
    if (!adminUser)
      return res
        .status(402)
        .json({ success: false, message: "User not found with this email" });

    const userPassword = adminUser.password;
    const isPasswordMatched = await bcrypt.compare(password, userPassword);
    if (!isPasswordMatched)
      return res
        .status(402)
        .json({ success: false, message: "email or password incorrect" });

    // now here user successfully logged in , so now we have to generate and send a token to user
    generateAndSendToken(adminUser, res);

    return res
      .status(201)
      .json({ success: true, message: "Login Successful!!" });
  } catch (err) {
    console.log("[ERROR] in login function : ", err);
    return res
      .status(501)
      .json({ success: false, message: "Login failed , server error" });
  }
};
