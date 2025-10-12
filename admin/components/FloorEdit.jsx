// import React, { useState, useEffect } from "react";
// import { Box, Label, Select, Input, FormGroup } from "@adminjs/design-system";

// const floorTypes = [
//   { value: "commercial", label: "Commercial" },
//   { value: "residential", label: "Residential" },
//   { value: "mixed", label: "Mixed" },
// ];

// function FloorsComponent({ onChange, property, record }) {

//   console.log("inside the custom component : " , record.params)

//   const initialValue = record.params[property.name] || {
//     numberOfFloors: 0,
//     floors: [],
//   };


//   const [numFloors, setNumFloors] = useState(initialValue.numberOfFloors || 0);
//   const [floors, setFloors] = useState(initialValue.floors || []);

//   // Sync floors array length with numberOfFloors immediately when numFloors changes
//   useEffect(() => {
//     const newFloors = [];
//     for (let i = 0; i < numFloors; i++) {
//       newFloors.push(
//         floors[i] || {
//           classification: "residential",
//           carpetAreaC: "",
//           emptyAreaC: "",
//           carpetAreaR: "",
//           emptyAreaR: "",
//         }
//       );
//     }
//     // Update floors state and notify AdminJS right here
//     setFloors(newFloors);
//     onChange("floorsData", { numberOfFloors: numFloors, floors: newFloors });
//   }, [numFloors]);

//   // When floor data changes, update state and notify AdminJS immediately
//   const handleFloorChange = (index, field, value) => {
//     const updatedFloors = [...floors];
//     updatedFloors[index] = {
//       ...updatedFloors[index],
//       [field]: value,
//     };
//     setFloors(updatedFloors);
//     const updatedValue = { numberOfFloors: numFloors, floors: updatedFloors }
//     onChange("floorsData", { numberOfFloors: numFloors, floors: updatedFloors });
//   };


//   // When number of floors input changes, update and notify immediately
//   const handleNumFloorsChange = (e) => {
//     const newVal = Number(e.target.value);
//     setNumFloors(newVal);
//     // onChange is called in useEffect after numFloors state changes
//   };

//   return (
//     <Box>
//       <FormGroup>
//         <Label>Number of Floors</Label>
//         <Input
//           type="number"
//           min={0}
//           value={numFloors}
//           onChange={handleNumFloorsChange}
//           width={100}
//           onWheel={(e) => e.preventDefault()}
//         />
//       </FormGroup>

//       {floors.map((floor, i) => (
//         <Box
//           key={i}
//           variant="grey"
//           padding="xl"
//           marginBottom="lg"
//           borderRadius="default"
//         >
//           <Label marginBottom="default" fontWeight="bold">
//             Floor {i + 1}
//           </Label>

//           <FormGroup>
//             <Label>Floor Type</Label>
//             <Select
//               options={floorTypes}
//               value={floorTypes.find(({ value }) => value === floor.classification) || null}
//               onChange={(selected) =>
//                 handleFloorChange(i, "classification", selected?.value || "")
//               }
//             />
//           </FormGroup>

//           {floor.classification === "commercial" && (
//             <>
//               <FormGroup>
//                 <Label>Carpet Area (C)</Label>
//                 <Input
//                   type="number"
//                   value={floor.carpetAreaC}
//                   onChange={(e) =>
//                     handleFloorChange(i, "carpetAreaC", e.target.value)
//                   }
//                 />
//               </FormGroup>
//               {(i==0) && <FormGroup>
//                 <Label>Empty Area (C)</Label>
//                 <Input
//                   type="number"
//                   value={floor.emptyAreaC}
//                   onChange={(e) =>
//                     handleFloorChange(i, "emptyAreaC", e.target.value)
//                   }
//                 />
//               </FormGroup>}
//             </>
//           )}

//           {floor.classification === "residential" && (
//             <>
//               <FormGroup>
//                 <Label>Carpet Area (R)</Label>
//                 <Input
//                   type="number"
//                   value={floor.carpetAreaR}
//                   onChange={(e) =>
//                     handleFloorChange(i, "carpetAreaR", e.target.value)
//                   }
//                 />
//               </FormGroup>
//              {(i==0) &&  <FormGroup>
//                 <Label>Empty Area (R)</Label>
//                 <Input
//                   type="number"
//                   value={floor.emptyAreaR}
//                   onChange={(e) =>
//                     handleFloorChange(i, "emptyAreaR", e.target.value)
//                   }
//                 />
//               </FormGroup>}
//             </>
//           )}

//           {floor.classification === "mixed" && (
//             <>
//               <FormGroup>
//                 <Label>Carpet Area (C)</Label>
//                 <Input
//                   type="number"
//                   value={floor.carpetAreaC}
//                   onChange={(e) =>
//                     handleFloorChange(i, "carpetAreaC", e.target.value)
//                   }
//                 />
//               </FormGroup>

//               {(i==0) && <FormGroup>
//                 <Label>Empty Area (C)</Label>
//                 <Input
//                   type="number"
//                   value={floor.emptyAreaC}
//                   onChange={(e) =>
//                     handleFloorChange(i, "emptyAreaC", e.target.value)
//                   }
//                 />
//               </FormGroup>}
              
//               <FormGroup>
//                 <Label>Carpet Area (R)</Label>
//                 <Input
//                   type="number"
//                   value={floor.carpetAreaR}
//                   onChange={(e) =>
//                     handleFloorChange(i, "carpetAreaR", e.target.value)
//                   }
//                 />
//               </FormGroup>

//               {(i==0) && <FormGroup>
//                 <Label>Empty Area (R)</Label>
//                 <Input
//                   type="number"
//                   value={floor.emptyAreaR}
//                   onChange={(e) =>
//                     handleFloorChange(i, "emptyAreaR", e.target.value)
//                   }
//                 />
//               </FormGroup>}
              
//             </>
//           )}
//         </Box>
//       ))}
//     </Box>
//   );
// }

// export default FloorsComponent;




// import React, { useState, useEffect } from "react";
// import { Box, Label, Select, Input, FormGroup } from "@adminjs/design-system";

// const floorTypes = [
//   { value: "commercial", label: "Commercial" },
//   { value: "residential", label: "Residential" },
//   { value: "mixed", label: "Mixed" },
// ];

// function FloorsComponent({ onChange, property, record }) {

//   console.log("inside the custom component : " , record.params)

//   const initialValue = record.params[property.name] || {
//     numberOfFloors: 0,
//     floors: [],
//   };


//   const [numFloors, setNumFloors] = useState(initialValue.numberOfFloors || '0');
//   const [floors, setFloors] = useState(initialValue.floors || []);

//   // Sync floors array length with numberOfFloors immediately when numFloors changes
//   useEffect(() => {
//     const newFloors = [];
//     for (let i = 0; i < numFloors; i++) {
//       newFloors.push(
//         floors[i] || {
//           classification: "residential",
//           carpetAreaC: "",
//           emptyAreaC: "",
//           carpetAreaR: "",
//           emptyAreaR: "",
//         }
//       );
//     }
//     // Update floors state and notify AdminJS right here
//     setFloors(newFloors);
//     onChange("floorsData", { numberOfFloors: numFloors, floors: newFloors });
//   }, [numFloors]);

//   // When floor data changes, update state and notify AdminJS immediately
//   const handleFloorChange = (index, field, value) => {
//     const updatedFloors = [...floors];
//     updatedFloors[index] = {
//       ...updatedFloors[index],
//       [field]: value,
//     };
//     setFloors(updatedFloors);
//     const updatedValue = { numberOfFloors: numFloors, floors: updatedFloors }
//     onChange("floorsData", { numberOfFloors: numFloors, floors: updatedFloors });
//   };


//   // When number of floors input changes, update and notify immediately
//   const handleNumFloorsChange = (e) => {
//     // const newVal = Number(e.target.value);
//     const newVal = (e.target.value);
//     setNumFloors(newVal);
//     // onChange is called in useEffect after numFloors state changes
//   };

//   return (
//     <Box>
//       <FormGroup>
//         <Label>Number of Floors</Label>
//         <Input
//           type="number"
//           // min={0}
//           value={numFloors}
//           onChange={handleNumFloorsChange}
//           width={100}
//           onWheel={(e) => e.preventDefault()}
//         />
//       </FormGroup>

//       {floors.map((floor, i) => (
//         <Box
//           key={i}
//           variant="grey"
//           padding="xl"
//           marginBottom="lg"
//           borderRadius="default"
//         >
//           <Label marginBottom="default" fontWeight="bold">
//             Floor {i + 1}
//           </Label>

//           <FormGroup>
//             <Label>Floor Type</Label>
//             <Select
//               options={floorTypes}
//               value={floorTypes.find(({ value }) => value === floor.classification) || null}
//               onChange={(selected) =>
//                 handleFloorChange(i, "classification", selected?.value || "")
//               }
//             />
//           </FormGroup>

//           {floor.classification === "commercial" && (
//             <>
//               <FormGroup>
//                 <Label>Carpet Area (C)</Label>
//                 <Input
//                   type="number"
//                   value={floor.carpetAreaC}
//                   onChange={(e) =>
//                     handleFloorChange(i, "carpetAreaC", e.target.value)
//                   }
//                 />
//               </FormGroup>
//               {(i==0) && <FormGroup>
//                 <Label>Empty Area (C)</Label>
//                 <Input
//                   type="number"
//                   value={floor.emptyAreaC}
//                   onChange={(e) =>
//                     handleFloorChange(i, "emptyAreaC", e.target.value)
//                   }
//                 />
//               </FormGroup>}
//             </>
//           )}

//           {floor.classification === "residential" && (
//             <>
//               <FormGroup>
//                 <Label>Carpet Area (R)</Label>
//                 <Input
//                   type="number"
//                   value={floor.carpetAreaR}
//                   onChange={(e) =>
//                     handleFloorChange(i, "carpetAreaR", e.target.value)
//                   }
//                 />
//               </FormGroup>
//              {(i==0) &&  <FormGroup>
//                 <Label>Empty Area (R)</Label>
//                 <Input
//                   type="number"
//                   value={floor.emptyAreaR}
//                   onChange={(e) =>
//                     handleFloorChange(i, "emptyAreaR", e.target.value)
//                   }
//                 />
//               </FormGroup>}
//             </>
//           )}

//           {floor.classification === "mixed" && (
//             <>
//               <FormGroup>
//                 <Label>Carpet Area (C)</Label>
//                 <Input
//                   type="number"
//                   value={floor.carpetAreaC}
//                   onChange={(e) =>
//                     handleFloorChange(i, "carpetAreaC", e.target.value)
//                   }
//                 />
//               </FormGroup>

//               {(i==0) && <FormGroup>
//                 <Label>Empty Area (C)</Label>
//                 <Input
//                   type="number"
//                   value={floor.emptyAreaC}
//                   onChange={(e) =>
//                     handleFloorChange(i, "emptyAreaC", e.target.value)
//                   }
//                 />
//               </FormGroup>}
              
//               <FormGroup>
//                 <Label>Carpet Area (R)</Label>
//                 <Input
//                   type="number"
//                   value={floor.carpetAreaR}
//                   onChange={(e) =>
//                     handleFloorChange(i, "carpetAreaR", e.target.value)
//                   }
//                 />
//               </FormGroup>

//               {(i==0) && <FormGroup>
//                 <Label>Empty Area (R)</Label>
//                 <Input
//                   type="number"
//                   value={floor.emptyAreaR}
//                   onChange={(e) =>
//                     handleFloorChange(i, "emptyAreaR", e.target.value)
//                   }
//                 />
//               </FormGroup>}
              
//             </>
//           )}
//         </Box>
//       ))}
//     </Box>
//   );
// }

// export default FloorsComponent;












// ================================ New Code ===============================
import React, { useState, useEffect } from "react";
import { Box, Label, Select, Input, FormGroup } from "@adminjs/design-system";

const floorTypes = [
  { value: "commercial", label: "Commercial" },
  { value: "residential", label: "Residential" },
  { value: "mixed", label: "Mixed" },
];

const floorCountOptions = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
  { value: 6, label: "6" },
];

function FloorsComponent({ onChange, property, record }) {

  console.log("inside the custom component : " , record.params)

  const initialValue = record.params[property.name] || {
    numberOfFloors: 0,
    floors: [],
  };


  const [numFloors, setNumFloors] = useState(initialValue.numberOfFloors || 0);
  const [floors, setFloors] = useState(initialValue.floors || []);

  // Sync floors array length with numberOfFloors immediately when numFloors changes
  useEffect(() => {
    const newFloors = [];
    for (let i = 0; i < numFloors; i++) {
      newFloors.push(
        floors[i] || {
          classification: "residential",
          carpetAreaC: "",
          emptyAreaC: "",
          carpetAreaR: "",
          emptyAreaR: "",
        }
      );
    }
    // Update floors state and notify AdminJS right here
    setFloors(newFloors);
    onChange("floorsData", { numberOfFloors: numFloors, floors: newFloors });
  }, [numFloors]);

  // When floor data changes, update state and notify AdminJS immediately
  const handleFloorChange = (index, field, value) => {
    const updatedFloors = [...floors];
    updatedFloors[index] = {
      ...updatedFloors[index],
      [field]: value,
    };
    setFloors(updatedFloors);
    const updatedValue = { numberOfFloors: numFloors, floors: updatedFloors }
    onChange("floorsData", { numberOfFloors: numFloors, floors: updatedFloors });
  };


  // When number of floors dropdown changes, update and notify immediately
  const handleNumFloorsChange = (selected) => {
    const newVal = selected?.value || 0;
    setNumFloors(newVal);
    // onChange is called in useEffect after numFloors state changes
  };

  return (
    <Box>
      <FormGroup>
        <Label>Number of Floors</Label>
        <Select
          options={floorCountOptions}
          value={floorCountOptions.find(({ value }) => value === numFloors) || null}
          onChange={handleNumFloorsChange}
          placeholder="Select number of floors"
        />
      </FormGroup>

      {floors.map((floor, i) => (
        <Box
          key={i}
          variant="grey"
          padding="xl"
          marginBottom="lg"
          borderRadius="default"
        >
          <Label marginBottom="default" fontWeight="bold">
            Floor {i + 1}
          </Label>

          <FormGroup>
            <Label>Floor Type</Label>
            <Select
              options={floorTypes}
              value={floorTypes.find(({ value }) => value === floor.classification) || null}
              onChange={(selected) =>
                handleFloorChange(i, "classification", selected?.value || "")
              }
            />
          </FormGroup>

          {floor.classification === "commercial" && (
            <>
              <FormGroup>
                <Label>Carpet Area (C)</Label>
                <Input
                  type="number"
                  value={floor.carpetAreaC}
                  onChange={(e) =>
                    handleFloorChange(i, "carpetAreaC", e.target.value)
                  }
                />
              </FormGroup>
              {(i==0) && <FormGroup>
                <Label>Empty Area (C)</Label>
                <Input
                  type="number"
                  value={floor.emptyAreaC}
                  onChange={(e) =>
                    handleFloorChange(i, "emptyAreaC", e.target.value)
                  }
                />
              </FormGroup>}
            </>
          )}

          {floor.classification === "residential" && (
            <>
              <FormGroup>
                <Label>Carpet Area (R)</Label>
                <Input
                  type="number"
                  value={floor.carpetAreaR}
                  onChange={(e) =>
                    handleFloorChange(i, "carpetAreaR", e.target.value)
                  }
                />
              </FormGroup>
             {(i==0) &&  <FormGroup>
                <Label>Empty Area (R)</Label>
                <Input
                  type="number"
                  value={floor.emptyAreaR}
                  onChange={(e) =>
                    handleFloorChange(i, "emptyAreaR", e.target.value)
                  }
                />
              </FormGroup>}
            </>
          )}

          {floor.classification === "mixed" && (
            <>
              <FormGroup>
                <Label>Carpet Area (C)</Label>
                <Input
                  type="number"
                  value={floor.carpetAreaC}
                  onChange={(e) =>
                    handleFloorChange(i, "carpetAreaC", e.target.value)
                  }
                />
              </FormGroup>

              {(i==0) && <FormGroup>
                <Label>Empty Area (C)</Label>
                <Input
                  type="number"
                  value={floor.emptyAreaC}
                  onChange={(e) =>
                    handleFloorChange(i, "emptyAreaC", e.target.value)
                  }
                />
              </FormGroup>}
              
              <FormGroup>
                <Label>Carpet Area (R)</Label>
                <Input
                  type="number"
                  value={floor.carpetAreaR}
                  onChange={(e) =>
                    handleFloorChange(i, "carpetAreaR", e.target.value)
                  }
                />
              </FormGroup>

              {(i==0) && <FormGroup>
                <Label>Empty Area (R)</Label>
                <Input
                  type="number"
                  value={floor.emptyAreaR}
                  onChange={(e) =>
                    handleFloorChange(i, "emptyAreaR", e.target.value)
                  }
                />
              </FormGroup>}
              
            </>
          )}
        </Box>
      ))}
    </Box>
  );
}

export default FloorsComponent;