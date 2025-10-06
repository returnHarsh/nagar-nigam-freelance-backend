import React from "react";
import { Label, Input, Box, Button } from "@adminjs/design-system";

const GetLocation = (props) => {
  const { record, onChange, property } = props;

  console.log("inside the location's custom component");
  console.log("record : ", record);
  console.log("property : ", property);

  // extract nested location values
  let latitude = record?.params["location.latitude"] || ""; 
  let longitude = record?.params["location.longitude"] || "";

  // if(!latitude) record?.params?.location?.latitude
  // if(!longitude) record?.params?.location?.longitude

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // update AdminJS form values
          onChange("location.latitude", lat);
          onChange("location.longitude", lon);
        },
        (error) => {
          console.error("Error fetching location:", error);
          alert("Unable to fetch location. Please allow location access.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <Box style={{margin : "25px 0px"}} >
      <Label>{property.label}</Label>
      <Box display="flex" gap="10px">
        <Input
          width={1 / 2}
          placeholder="Latitude"
          value={latitude}
          onChange={(e) => onChange("location.latitude", e.target.value)}
        />
        <Input
          width={1 / 2}
          placeholder="Longitude"
          value={longitude}
          onChange={(e) => onChange("location.longitude", e.target.value)}
        />
      </Box>

      {onChange && <Box marginTop="10px">
        <Button variant="primary" type="button" onClick={handleGetLocation}>
          Get Location
        </Button>
      </Box>}
      
    </Box>
  );
};

export default GetLocation;
