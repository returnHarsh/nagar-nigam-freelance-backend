
// import { DateTime } from "luxon"

// export const toIST = function (date) {
//   const istOffset = 5.5 * 60; // IST = UTC + 5:30 hours
//   const istTime = new Date(date.getTime() + istOffset * 60 * 1000);
//   return istTime;
// }

// export function getISTDayRange(dateS = new Date() , dateE = new Date()) {

//   console.log("dateS is : " , dateS)
//   console.log("dateE is : " , dateE)

//     const yearS  = dateS.getFullYear();
//     const monthS = dateS.getMonth();
//     const dayS   = dateS.getDate();

//     const yearE  = dateE.getFullYear();
//     const monthE = dateE.getMonth();
//     const dayE   = dateE.getDate();

//     // Construct start and end in IST
//     const dayStart = new Date(yearS, monthS, dayS, 0, 0, 0, 0);     // 00:00:00 IST
//     const dayEnd   = new Date(yearE, monthE, dayE, 23, 59, 59, 999); // 23:59:59.999 IST

//     console.log("dayStart is : " , dayStart)
//     console.log("dayEnd is : " , dayEnd)

//     return { dayStart, dayEnd };
// }




export function getDayRange(dateS = new Date(), dateE = new Date()) {

  console.log("dateS is : ", dateS)
  console.log("dateE is : ", dateE)

  const yearS = dateS.getUTCFullYear();
  const monthS = dateS.getUTCMonth();
  const dayS = dateS.getUTCDate();

  const yearE = dateE.getUTCFullYear();
  const monthE = dateE.getUTCMonth();
  const dayE = dateE.getUTCDate();

  // Construct start and end in IST
  const dayStart = new Date(yearS, monthS, dayS, 0, 0, 0, 0);     // 00:00:00 IST
  const dayEnd = new Date(yearE, monthE, dayE, 23, 59, 59, 999); // 23:59:59.999 IST

  console.log("dayStart is : ", dayStart)
  console.log("dayEnd is : ", dayEnd)

  return { dayStart, dayEnd };
}

// export const toIST = (date)=> {
//   if (!date) {
//     // Current date/time in IST
//     return DateTime.now().setZone("Asia/Kolkata").toJSDate();
//   }

//   if (date instanceof Date) {
//     // JS Date object → assume UTC
//     return DateTime.fromJSDate(date, { zone: "utc" })
//       .setZone("Asia/Kolkata")
//       .toJSDate();
//   }

//   if (typeof date === "string") {
//     // ISO string → parse as UTC
//     return DateTime.fromISO(date, { zone: "utc" })
//       .setZone("Asia/Kolkata")
//       .toJSDate();
//   }

//   throw new Error("Invalid date input. Must be a Date object or ISO string.");
// };