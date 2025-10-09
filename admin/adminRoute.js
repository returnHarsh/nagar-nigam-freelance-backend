import AdminJS, { actions, ComponentLoader } from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import uploadFeature from "@adminjs/upload";
import fs from "fs"
import path from "path"
import XLSX from "xlsx"
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import dotenv from "dotenv";
dotenv.config();

import multer from "multer";
// Multer setup to store file in memory
const upload = multer({ storage: multer.memoryStorage() });


import { User } from "../models/user.js"
import { after_createNewProperty, after_createNewUser, after_editNewProperty, after_editUser, after_newARVModificationHook, after_newPaymentHook, before_createNewProperty, before_createNewUser, before_editNewProperty, before_editUser, before_newPaymentHook } from "./adminControllersFunctions.js";
import { logAuditAction } from "./adminFunctions/logAuditAction.js";
import Surveyor from "../models/surveyor.js";
import { Property } from "../models/property.js";
import { Rate } from "../models/rate.js";
import { Payment } from "../models/payment.js";
import { features } from "process";
import { s3, uploadToS3 } from "../config/S3.js";
import { NagarNigamProperty } from "../models/nagarNigamProperty.js"
import { Tax } from "../models/tax.js";
import { generateTaxBillPDF } from "./actions/generateReciept.js";
import {ARVModification} from "../models/arvModification.js"
import { bulkUploadNagarNigamData } from "./actions/bulkUploadNagarNigamData.js";


// lets create the uploads folder is it doens'nt exist
const isUploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(isUploadDir)) fs.mkdirSync(isUploadDir, { recursive: true });


// for loading the custom components
const componentLoader = new ComponentLoader();

// Register your React component
const AdminCustomComponents = {
  FloorEditComponent: componentLoader.add(
    "FloorEdit",
    path.resolve(__dirname, "./components/FloorEdit.jsx")
  ),
  RateModelEditComponent: componentLoader.add(
    "RateModelEdit",
    path.resolve(__dirname, "./components/RateModelEdit.jsx")
  ),
  GetLocationComp: componentLoader.add(
    "GetLocation",
    path.resolve(__dirname, "./components/GetLocation.jsx")
  ),
  ShowDueAmountComp: componentLoader.add(
    'ShowDueAmount',
    path.resolve(__dirname, "./components/ShowDueAmount.jsx")
  ),
  HouseNumberSelect: componentLoader.add(
    'HouseNumberSelect',
    path.resolve(__dirname, "./components/HouseNumberSelect.jsx")

  ),
  NagarNigamPropertyUpload: componentLoader.add(
    'NagarNigamPropertyUpload',
    path.resolve(__dirname, "./components/UploadExcelButton.jsx")
  ),
  GenerateTaxBillComp: componentLoader.add(
    'GenerateTaxBillComp',
    path.resolve(__dirname, './components/GenerateAndDownloadPdf.jsx')
  ),
  ModifyARVComponent : componentLoader.add(
    'ModifyARVComponent' ,
    path.resolve(__dirname , './components/ModifyARVComponent.jsx')
  )
  // CutomButtonComponent : componentLoader.add(
  //   'CustomPage',
  //   path.resolve(__dirname , "./components/CustomPage.jsx" )
  // )
};


// Register the Mongoose adapter so AdminJS can work with Mongoose models
AdminJS.registerAdapter(AdminJSMongoose);

const adminJs = new AdminJS({
  resources: [
    { 
      resource: User,
      options: {
        navigation: {name : "Admin Only", icon : "User" , isAccessible : ({currentAdmin}) => (currentAdmin.role == "admin") },
        actions: {
          isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
          new: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
            before: before_createNewUser,
            after: after_createNewUser
          },
          edit: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
            before: before_editUser,
            after: after_editUser
          },
           list: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
          },
          delete: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
          },
          show: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
          },
        },
        properties: {
          createdAt: { isVisible: false },
          updatedAt: { isVisible: false },
        },
      }
    },
    {
      resource: Surveyor,
      options: {
        navigation: "Admin Only",
        actions: {
          new: { isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin") },
          edit: { isAccessible: false },
          list: { isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin") },
          delete: { isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin") },
          show: { isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin") },
        },
        properties: {
          createdAt: { isVisible: false },
          updatedAt: { isVisible: false },
        },
      }
    },
    {
      resource: Property,
      options: {
        listProperties: ["PTIN", "houseNumber", "ownerName", "fatherName"],
        actions: {
          new: {
            before: before_createNewProperty,
            after: after_createNewProperty,
          },
          edit: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
            before: before_editNewProperty,
            after: after_editNewProperty,
          },
          generateTaxBillPDF: {
            actionType: 'record',
            icon: 'Print',
            label: 'Print Reciept',
            component: AdminCustomComponents.GenerateTaxBillComp,
            handler: async (request, response, context) => {
              // You can return your relevant data here or just the record
              return {
                record: context.record.toJSON(context.currentAdmin),
              };
            }
          }
          // generateTaxBill: {
          //   actionType: 'record',
          //   icon: 'Receipt',
          //   label: 'Generate Tax Bill',
          //   component: false,
          //   guard: 'Generate tax bill PDF?',
          //   handler: async (request, response, context) => {
          //     try {
          //       const propertyId = context.record.id();
          //       const property = await Property.findById(propertyId).lean();

          //       if (!property) {
          //         throw new Error('Property not found');
          //       }

          //       // Get latest tax
          //       const latestTax = await Tax.findOne({ propertyId })
          //         .sort({ createdAt: -1 })
          //         .lean();

          //       if (!latestTax) {
          //         return {
          //           record: context.record.toJSON(context.currentAdmin),
          //           notice: {
          //             message: 'No tax record found. Create a tax entry first.',
          //             type: 'error'
          //           }
          //         };
          //       }

          //       // Generate PDF
          //       const pdfBuffer = await generateTaxBillPDF(property, latestTax);

          //       // Upload to S3
          //       const pdfFilename = `tax-bill-${property.PTIN}-${Date.now()}.pdf`;
          //       const s3Key = `bills/${pdfFilename}`;

          //       const creds = await s3().config.credentials();
          //       console.log("Resolved credentials:", creds);

          //       // await s3().send(new PutObjectCommand({
          //       //   Bucket: process.env.AWS_BUCKET,
          //       //   Key: s3Key,
          //       //   Body: pdfBuffer,
          //       //   ContentType: 'application/pdf'
          //       // }));

          //       await uploadToS3(process.env.AWS_BUCKET , s3Key , pdfBuffer , 'application/pdf')

          //       const pdfUrl = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

          //       // Update property
          //       await Property.findByIdAndUpdate(propertyId, {
          //         latestBillUrl: pdfUrl,
          //         lastBillGeneratedAt: new Date()
          //       });

          //       return {
          //         record: context.record.toJSON(context.currentAdmin),
          //         notice: {
          //           message: 'Tax bill generated successfully!',
          //           type: 'success'
          //         },
          //         redirectUrl: pdfUrl
          //       };

          //     } catch (err) {
          //       console.error('PDF generation error:', err);
          //       return {
          //         record: context.record.toJSON(context.currentAdmin),
          //         notice: {
          //           message: `Error: ${err.message}`,
          //           type: 'error'
          //         }
          //       };
          //     }
          //   }
          // }
        },
        properties: {

          // ========= need to uncomment =========
          houseNumber: {
            components: { edit: AdminCustomComponents.HouseNumberSelect }
          },
          // // field that the surveyor cannot change
          // fatherName: { isDisabled: true },
          // ownerName: { isDisabled: true },

          // ========== up until here ============

          displayId: { isTitle: true },
          editProof: {
            isVisible: { edit: true, new: false }
          },
          PTIN: { isVisible: { list: false, edit: false, filter: false, show: true } },
          floorsData: { type: "mixed", components: { edit: AdminCustomComponents.FloorEditComponent } },
          location: { components: { edit: AdminCustomComponents.GetLocationComp, show: AdminCustomComponents.GetLocationComp } },

          // fields not to show on admin form
          displayId: { isVisible: false },
          createdAt: { isVisible: false },
          updatedAt: { isVisible: false },
          receiptWithSign: { isVisible: false },
          ownerInterviewer: { isVisible: false },
          IDProof: { isVisible: false },
          houseFrontWithNamePlate: { isVisible: false },

          tax : {
            isVisible : {show : true , edit : false},
          },

          latestBillUrl: {
            type: 'string',
            isVisible: { list: false, show: true, edit: false }
          },
          lastBillGeneratedAt: {
            type: 'datetime',
            isVisible: { list: false, show: true, edit: false }
          },
        }
      },
      features: [
        uploadFeature({
          provider: {
            aws: {
              bucket: process.env.AWS_BUCKET,
              client: s3(),
              region: process.env.AWS_REGION
            },
          },
          properties: {
            key: "receiptWithSign", // name of the DB field in which the path of the picture is gonna stored
            file: "receiptWithSignFile",
            filePath: "receiptWithSignPath", // 👈 must be unique
            filesToDelete: "receiptWithSignToDelete", // 👈 must be unique
          },
          uploadPath: (record, filename) => {
            const uniqueID = record?.params?._id || "temp";
            return `property/receiptWithSign/${uniqueID}-${Date.now()}-${filename}`;
          },
          componentLoader,
        }),
        uploadFeature({
          provider: {
            aws: {
              bucket: process.env.AWS_BUCKET,
              client: s3(),
              region: process.env.AWS_REGION
            },
          },
          properties: {
            key: "ownerInterviewer",
            file: "ownerInterviewerFile",
            filePath: "ownerInterviewerPath",
            filesToDelete: "ownerInterviewerToDelete",
          },
          uploadPath: (record, filename) => {
            const uniqueID = record?.params?._id || "temp";
            return `property/ownerInterviewer/${uniqueID}-${Date.now()}-${filename}`;
          },
          componentLoader,
        }),
        uploadFeature({
          provider: {
            aws: {
              bucket: process.env.AWS_BUCKET,
              client: s3(),
              region: process.env.AWS_REGION
            },
          },
          properties: {
            key: "IDProof",
            file: "IDProofFile",
            filePath: "IDProofPath",
            filesToDelete: "IDProofToDelete",
          },
          uploadPath: (record, filename) => {
            const uniqueID = record?.params?._id || "temp";
            return `property/IDProof/${uniqueID}-${Date.now()}-${filename}`;
          },
          componentLoader,
        }),
        uploadFeature({
          provider: {
            aws: {
              bucket: process.env.AWS_BUCKET,
              client: s3(),
              region: process.env.AWS_REGION
            },
          },
          properties: {
            key: "houseFrontWithNamePlate",
            file: "houseFrontWithNamePlateFile",
            filePath: "houseFrontWithNamePlatePath",
            filesToDelete: "houseFrontWithNamePlateToDelete",
          },
          uploadPath: (record, filename) => {
            const uniqueID = record?.params?._id || "temp";
            return `property/houseFrontWithNamePlate/${uniqueID}-${Date.now()}-${filename}`;
          },
          componentLoader,
        }),
      ],
    },
    {
      resource: NagarNigamProperty,
      options: {
        navigation : {name : "Admin Only" , icon : "User"},
        actions: {
          new: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
          },
          edit: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
          },
           list: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin" ),
          },
          delete: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin" ),
          },
          show: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin" ),
          },
          uploadNagarNigamData: {
            actionType: 'resource',
            label: 'Upload Nagar Nigam Data',
            icon: 'Upload',
            component: AdminCustomComponents.NagarNigamPropertyUpload,

            // handler: async (request, response, context) => {
            //   console.log("inside the handler function");

            //   try {
            //     const { file, filename } = request.payload;

            //     if (!file) {
            //       return {
            //         record: {},
            //         notice: {
            //           message: "No file uploaded",
            //           type: "error"
            //         }
            //       };
            //     }

            //     // Decode base64 file
            //     const base64Data = file.split(',')[1];
            //     const buffer = Buffer.from(base64Data, 'base64');

            //     // Parse Excel file
            //     const workbook = XLSX.read(buffer, { type: 'buffer' });
            //     const sheetName = workbook.SheetNames[0];
            //     const worksheet = workbook.Sheets[sheetName];

            //     // Convert to JSON
            //     const jsonData = XLSX.utils.sheet_to_json(worksheet);

            //     console.log("Parsed rows:", jsonData.length);
            //     console.log("First row columns:", jsonData[0] ? Object.keys(jsonData[0]) : []);

            //     if (jsonData.length === 0) {
            //       return {
            //         record: {},
            //         notice: {
            //           message: "Excel file is empty",
            //           type: "error"
            //         }
            //       };
            //     }

            //     // Map Excel columns to your schema
            //     const records = jsonData.map(row => ({
            //       houseNumber: String(row['House Number'] || row['houseNumber'] || row['house_number'] || '').trim(),
            //       ownerName: String(row['Owner Name'] || row['ownerName'] || row['Name'] || row['name'] || '').trim(),
            //       fatherName: String(row["Father's Name"] || row['fatherName'] || row['father_name'] || '').trim(),
            //       prevHouseTax: (parseFloat(row['prevHouseTax'] ?? row['prev house tax'] ?? row['prev houseTax'] ?? 0) || 0),
            //       prevWaterTax: (parseFloat(row['prevWaterTax'] ?? row["prev water tax"] ?? row['prevWaterTax'] ?? 0) || 0),
            //       prevTax: (parseFloat(row['prevHouseTax'] ?? row['prev house tax'] ?? row['prev houseTax'] ?? 0) || 0) + (parseFloat(row['prevWaterTax'] ?? row["prev water tax"] ?? row['prevWaterTax'] ?? 0) || 0),
            //     }));

            //     console.log("Mapped records:", records.length);

            //     // Filter out empty records
            //     const validRecords = records.filter(record =>
            //       record.houseNumber !== '' && record.ownerName !== '' && record.fatherName !== ''
            //     );

            //     console.log("Valid records:", validRecords.length);

            //     if (validRecords.length === 0) {
            //       return {
            //         record: {},
            //         notice: {
            //           message: "No valid records found in Excel file. Please check column names.",
            //           type: "error"
            //         }
            //       };
            //     }

            //     // Use the imported model directly instead of context.resource.Model
            //     const bulkOps = validRecords.map(record => ({
            //       updateOne: {
            //         filter: { ownerName: record.ownerName, houseNumber: record.houseNumber, fatherName: record.fatherName },
            //         update: { $set: record },
            //         upsert: true
            //       }
            //     }));

            //     // ✅ USE THE IMPORTED MODEL DIRECTLY
            //     const result = await NagarNigamProperty.bulkWrite(bulkOps);

            //     // console.log("Bulk write result:", result);

            //     return {
            //       record: {},
            //       notice: {
            //         message: `Successfully uploaded ${validRecords.length} records. (${result.upsertedCount} new, ${result.modifiedCount} updated)`,
            //         type: "success"
            //       }
            //     };

            //   } catch (error) {
            //     console.error("Upload error:", error);
            //     return {
            //       record: {},
            //       notice: {
            //         message: `Upload failed: ${error.message}`,
            //         type: "error"
            //       }
            //     };
            //   }
            // }
            handler : bulkUploadNagarNigamData

          }
        }
      }
    },
    {
      resource: Rate,
      options: {
        navigation: "Admin Only",
        actions: {
          list: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
          },
          new: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
          },
          edit: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
          },
          delete: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
          },
          show: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
          },
        },
        properties: {
          createdAt: { isVisible: false },
          updatedAt: { isVisible: false },
          lessThan9m: {
            components: {
              edit: AdminCustomComponents.RateModelEditComponent,
              show: AdminCustomComponents.RateModelEditComponent,
            },
            custom: { path: "lessThan9m" },
          },
          from9to12m: {
            components: {
              edit: AdminCustomComponents.RateModelEditComponent,
              show: AdminCustomComponents.RateModelEditComponent,
            },
            custom: { path: "from9to12m" },
          },
          from12to24m: {
            components: {
              edit: AdminCustomComponents.RateModelEditComponent,
              show: AdminCustomComponents.RateModelEditComponent,
            },
            custom: { path: "from12to24m" },
          },
          moreThan24m: {
            components: {
              edit: AdminCustomComponents.RateModelEditComponent,
              show: AdminCustomComponents.RateModelEditComponent,
            },
            custom: { path: "moreThan24m" },
          },
        },
      },
    },
    {
      resource: Payment,
      features: [
        uploadFeature({
          provider: {
            aws: {
              bucket: process.env.AWS_BUCKET,
              client: s3(),
              region: process.env.AWS_REGION
            }
          },
          properties: {
            key: "receiptProofUrl", // DB field to store S3 object key
            file: "receiptProofFile", // virtual property for AdminJS upload
            filePath: "receiptProofPath",  // optional, must be unique if used
            filesToDelete: "receiptProofToDelete" // optional
          },
          uploadPath: (record, fileName) => {
            const uniqueID = record?.params?._id || "temp";
            return `payments/receiptProof/${uniqueID}-${Date.now()}-${fileName}`;
          },
          componentLoader
        })
      ],
      options: {
        navigation: {name : "Officials" , icon : "Shield"},
        actions: {
          new: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin"),
            before: before_newPaymentHook,
            after: after_newPaymentHook
          },
          edit: { isAccessible: false },
           list: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin" ),
          },
          delete: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin" ),
          },
          show: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin" ),
          },
        },
        properties: {
          showDueAmount: {
            isVisible: { list: false, filter: false, show: false, edit: true },
            components: {
              edit: AdminCustomComponents.ShowDueAmountComp
            }
          },
          createdAt: { isVisible: false },
          updatedAt: { isVisible: false },
          receiptProofUrl: { isVisible: false },
          receiptProofS3Url: {
            isVisible: { list: true, filter: true, show: true, edit: false },
          }
        }
      },
    },
    {
      resource: Tax,
      options: {
        navigation : {name : "Officials" , icon : "Shield"},
        actions: {
          new: {
            isAccessible: false
          },
          edit: {
            // isAccessible : ({currentAdmin})=> (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin" ),
            isAccessible: false
          },
           list: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin" ),
          },
          delete: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin" ),
          },
          show: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin" ),
          },
          getTaxDetails: {
            actionType: 'record',
            // isVisible: false, // Hidden from UI, only accessible via API
            handler: async (request, response, context) => {
              try {
                const { propertyId } = request.query;

                if (!propertyId) {
                  return {
                    record: {},
                    data: {
                      dueTax: 0,
                      totalTax: 0,
                      error: 'Property ID is required'
                    }
                  };
                }

                const latestTax = await Tax.findOne({ propertyId })
                  .sort({ createdAt: -1 })
                  .lean();

                console.log("LATEST TAX IS : ", latestTax)

                if (latestTax) {
                  return {
                    record: {},
                    data: {
                      dueTax: latestTax.dueAmount || 0,
                      totalTax: latestTax.totalTax || 0,
                      error: null
                    }
                  };
                } else {
                  return {
                    record: {},
                    data: {
                      dueTax: 0,
                      totalTax: 0,
                      error: 'No tax records found'
                    }
                  };
                }

              } catch (err) {
                console.error('[Error] getTaxDetails handler:', err.message);
                return {
                  record: {},
                  data: {
                    dueTax: null,
                    totalTax: null,
                    error: 'Failed to fetch tax details'
                  }
                };
              }
            }
          },
          getTaxARV: {
            isVisible : false,
            actionType: 'record',
            handler: async (request, response, context) => {
              try {

                const { propertyId } = request.query

                if (!propertyId) {
                  return {
                    record: {},
                    data: {
                      currentARV: 0,
                      currentTotalTax: 0,
                      error: 'Property ID is required'
                    }
                  };
                }

                const latestTax = await Tax.findOne({propertyId}).sort({createdAt : -1}).lean();
                console.log("Latest Tax is : " , latestTax)
                if(!latestTax) return {
                  record : {},
                  data : { currentARV : 0 , currentTotalTax : 0 , error : 'Tax document not found'}
                }

                const property = await Property.findById(propertyId)

                const prePropertyByNagarNigam = await NagarNigamProperty.findOne({fatherName : property?.fatherName , ownerName : property?.ownerName , houseNumber : property?.houseNumber })

                let bakaya = 0;
                if(prePropertyByNagarNigam){
                  bakaya = prePropertyByNagarNigam?.prevTax
                }

                return {
                  record : {},
                  data : {currentARV : latestTax.arv , currentTotalTax : latestTax.totalTax , bakaya , dueAmount : latestTax?.dueAmount , paidAmount : latestTax?.paidAmount , error : null}
                }


              } catch (err) {
                console.log("[ERROR] in action getTaxARV : " , err.message);
                return {
                  record : {},
                  data : {currentARV : null , currentTotalTax : null , error : err.message}
                }
              }
            }
          }
        }
      }
    },
    {
      resource : ARVModification,
      features: [
        uploadFeature({
          provider: {
            aws: {
              bucket: process.env.AWS_BUCKET,
              client: s3(),
              region: process.env.AWS_REGION
            }
          },
          properties: {
            key: "modificationProof", // DB field to store S3 object key
            file: "modificationProofFile", // virtual property for AdminJS upload
            filePath: "modificationProofPath",  // optional, must be unique if used
            filesToDelete: "modificationProofToDelete" // optional
          },
          uploadPath: (record, fileName) => {
            const uniqueID = record?.params?._id || "temp";
            return `arvModification/${uniqueID}-${Date.now()}-${fileName}`;
          },
          componentLoader
        })
      ],
      options : {
        navigation : {name : "Officials" , icon : "Shield"},
        actions : {
          new : {
            isAccessible : ({currentAdmin}) => (currentAdmin.role == "admin" || currentAdmin.role == "super-admin"),
            after : after_newARVModificationHook
          },
          edit : {
            // isAccessible : ({currentAdmin}) => (currentAdmin.role == "admin" || currentAdmin.role == "super-admin")
            isAccessible : false
          },
           list: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin" ),
          },
          delete: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin" ),
          },
          show: {
            isAccessible: ({ currentAdmin }) => (currentAdmin?.role == "admin" || currentAdmin?.role == "super-admin" ),
          },
        },
        properties : {
          arvModificationWidget : {
            type : 'mixed',
            isVisible : {
              list : false,
              edit : true,
              show : true,
              filter : false
            },
            components : {
              edit: AdminCustomComponents.ModifyARVComponent,
              show: AdminCustomComponents.ModifyARVComponent
            }
          },
          modificationProof : {isVisible : false}
        }
      }
    }
  ],
  branding: {
    companyName: "Nagar Nigam",
    softwareBrothers: false,
    logo: false,
  },
  // pages: {
  //   runMyFunction: {
  //     label: "Run Function",
  //     handler: customButton,
  //     component: AdminCustomComponents.CutomButtonComponent,
  //   },
  // },
  locale: {
    language: "en",
    translations: {
      en: {
        labels: {
          Rate: "Rate Matrix",
          Property: "Property Records",
          Form: "Forms",
          User: "System Users",
          nagar_nigam: "नगर निगम",
          "Admin Only": "Admin Only",
        },
      },
    },
    i18n: {
      debug: false,
    },
  },
  componentLoader,
  dashboard: null,
  rootPath: "/admin"
})

adminJs.watch();

const ADMIN_DUMMY = {
  email: "admin@gmail.com",
  password: "admin@12345",
  role: "super-admin"
}

const dummyAuthenticate = async (email, password) => {
  return ADMIN_DUMMY
}

const authenticate = async (email, password) => {
  console.log(`[INFO] LOGIN ATTEMPT with credentials email : ${email}  password : ${password} `)
  // if(email == ADMIN_DUMMY.email && ADMIN_DUMMY.password) return ADMIN_DUMMY

  const user = await User.findOne({ email });
  if (!user) {
    console.warn("❌ user not found on DB")
    return null;
  }

  const isPasswordMatch = await user.decryptPassword(password);
  if (!isPasswordMatch) {
    console.warn("❌  password is wrong")
    return null;
  }

  const { password: _, ...safeUser } = user.toObject();

  // here storing the user login log
  await logAuditAction(null, user?._id, "login", "User", user?._id)

  console.log("[INFO] HAPPY LOGIN");
  return safeUser;

}

export const adminRouter = AdminJSExpress.buildAuthenticatedRouter(adminJs, {
  authenticate,
  // authenticate : dummyAuthenticate,
  cookieName: "adminjs",
  cookiePassword: process.env.SECRET_KEY,
}, null,
  {
    before: (req, res, next) => {
      upload.any()(req, res, next);  // ✅ this is the correct way to attach multer
    },
  })