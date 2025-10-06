import React from "react";
// import { ConstructionType, RoadWidthType } from "../../utils/data.js";
// import { buildOject } from "../adminUtils/adminUtils.js";
import {ConstructionType , RoadWidthType} from "../../data/constants.js"
import {buildOject} from "../adminFunctions/helper.js"



const RateModelEdit = (props) => {
  const { record, onChange, property } = props;


  console.log("property : " , property.path)
  console.log("record : " , record)


// here I am recieving the custom path that I am passing from my admin js , where I am calling this component inside the propert tab
const path = property.path
// console.log("💁 path is : " , path)



// here we are creating a valid js object , because adminjs flatten the nested object
const value = buildOject(record.params , property)
// console.log("🚀 value is : " , value)




  // Handle change for nested field
  const handleChange = (key, newValue) => {
	console.log("tried calling handle change function .......")
    onChange && onChange(`${property.path}.${key}`, newValue);
  };


  return (
    <div style={styles.container}>
      <h3 style={styles.header}>{RoadWidthType[property.path]}</h3>
      <div style={styles.fieldsContainer}>
        {Object.entries(ConstructionType).map(([key, label]) => (
          <div key={key} style={styles.field}>
            <label style={styles.label}>{label} ka <span style={{fontWeight : "bold"}} >दर</span> </label>
            <input
              type="text"
              value={value[key] || ""}
              placeholder={`Enter ${label} ka rate`}
              onChange={(e) => handleChange(key, e.target.value)}
              style={styles.input}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Inline styles (you can replace with CSS or styled-components)
const styles = {
  container: {
    padding: "16px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    border: "1px solid #ddd",
    marginBottom: "16px",
  },
  header: {
    fontSize: "18px",
    marginBottom: "12px",
    color: "#333",
  },
  fieldsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "4px",
    fontWeight: "500",
    color: "#555",
  },
  input: {
    padding: "8px 12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
};

export default RateModelEdit;
