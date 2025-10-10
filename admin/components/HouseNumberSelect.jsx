// import { useState, useEffect } from "react";
// import { ApiClient, useRecord } from "adminjs";
// import { FormGroup, Label, Select } from "@adminjs/design-system";

// const api = new ApiClient();

// const HouseNumberSelect = ({ property, record, onChange }) => {
//   const [options, setOptions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const { handleChange } = useRecord();

//   console.log("Property object:", property);

//   const fetchAllPreProperty = async () => {
//     try {
//       setLoading(true);
//       const perPage = 500;
//       let page = 1;
//       let totalDoc = [];
//       let shouldContinue = true;

//       while (shouldContinue) {
//         console.log(`Fetching page ${page}...`);

//         const res = await api.resourceAction({
//           resourceId: "NagarNigamProperty",
//           actionName: "list",
//           params: {
//             page,
//             perPage
//           }
//         });

//         const currentRecords = res.data?.records || [];
//         const mappedRecords = currentRecords.map(r => r.params);

//         totalDoc = totalDoc.concat(mappedRecords);

//         console.log(`Fetched ${mappedRecords.length} records from page ${page}`);

//         if (mappedRecords.length < perPage) {
//           shouldContinue = false;
//         }

//         page++;
//       }

//       console.log(`Total documents fetched: ${totalDoc.length}`);

//       const formattedOptions = totalDoc
//         .filter(doc => doc.houseNumber)
//         .map(doc => ({
//           value: doc.houseNumber,
//           label: doc.houseNumber,
//           data: {
//             ownerName: doc.ownerName,
//             fatherName: doc.fatherName,
//             prevTax: doc.prevTax,
//             PTIN: doc.PTIN
//           }
//         }));

//       setOptions(formattedOptions);
//       console.log("Options set:", formattedOptions.length);

//     } catch (err) {
//       console.error("[ERROR] in fetchAllPreProperty:", err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAllPreProperty();
//   }, []);

//   const handleSelect = (selectedOption) => {
//     if (!selectedOption) {
//       // ✅ Handle clear - use property.path or property.name
//       onChange(property.path || property.name, '');
//       return;
//     }

//     const selectedHouse = options.find(opt => opt.value === selectedOption.value);
//     if (!selectedHouse) return;

//     console.log("Selected house:", selectedHouse);

//     // ✅ CRITICAL FIX: onChange expects (propertyPath, value)
//     // Use property.path (preferred) or property.name as fallback
//     onChange(property.path || property.name, selectedHouse.value);

//     // Auto-fill other fields
//     setTimeout(() => {
//       if (selectedHouse.data.ownerName) {
//         onChange('ownerName' , selectedHouse.data.ownerName)
//         // handleChange({
//         //   target: {
//         //     name: 'ownerName',
//         //     value: selectedHouse.data.ownerName
//         //   }
//         // });
//       }

//       if (selectedHouse.data.fatherName) {
//         onChange('fatherName' , selectedHouse.data.fatherName)

//         // handleChange({
//         //   target: {
//         //     name: 'fatherName',
//         //     value: selectedHouse.data.fatherName
//         //   }
//         // });
//       }

//       // if (selectedHouse.data.prevTax !== undefined) {
//       //   handleChange({
//       //     target: {
//       //       name: 'prevTax',
//       //       value: selectedHouse.data.prevTax
//       //     }
//       //   });
//       // }
//     }, 0);
//   };

//   // Find current selected value
//   const selectedValue = options.find(
//     opt => opt.value === record?.params?.[property.path || property.name]
//   );

//   return (
//     <FormGroup>
//       <Label>{property.label}</Label>
//       <Select
//         value={selectedValue}
//         options={options}
//         onChange={handleSelect}
//         isLoading={loading}
//         placeholder="Select house number..."
//         isClearable
//         isSearchable
//       />
//     </FormGroup>
//   );
// };

// export default HouseNumberSelect;






import { useState, useEffect } from "react";
import { ApiClient } from "adminjs";
import { FormGroup, Label, Input, Button, Box, MessageBox } from "@adminjs/design-system";

const api = new ApiClient();

const HouseNumberInput = ({ property, record, onChange }) => {
  const [inputValue, setInputValue] = useState(record?.params?.[property.path || property.name] || '');
  const[ward] = useState(record?.params?.ward)
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const currentValue = record?.params?.[property.path || property.name];
    if (currentValue) {
      setInputValue(currentValue);
    }
  }, [record?.params, property.path, property.name]);

  const fetchHouseData = async (houseNumber) => {
    if (!houseNumber || houseNumber.trim() === '' || !ward) {
      // setMessage({ text: 'Please enter a house number and ward', type: 'error' });
      setMessage({ text: 'No records available for this house number or ward', type: 'error' });
      onChange('houseNumber' , houseNumber)
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      console.log('Searching for house number:', houseNumber);

      const searchValue = houseNumber.trim();
      let foundData = null;
      let page = 1;
      const perPage = 500;

      // Search through pages until we find the house number
      while (!foundData) {
        const res = await api.resourceAction({
          resourceId: "NagarNigamProperty",
          actionName: "list",
          params: {
            page,
            perPage
          }
        });

        const records = res.data?.records || [];
        
        if (records.length === 0) {
          // No more records to search
          break;
        }

        // Search for exact match in current page
        const matchingRecord = records.find(r => 
          (r.params.houseNumber === searchValue && ward)
        );

        if (matchingRecord) {
          foundData = matchingRecord.params;
          break;
        }

        // If we got less than perPage, we've reached the end
        if (records.length < perPage) {
          break;
        }

        page++;
      }

      if (!foundData) {
        setMessage({ 
          text: `No data found for house number: ${houseNumber}`, 
          type: 'error' 
        });
        return;
      }

      console.log('Found house data:', foundData);

      // Update house number
      onChange(property.path || property.name, foundData.houseNumber);

      // Auto-fill other fields
      setTimeout(() => {
        if (foundData.ownerName) {
          onChange('ownerName', foundData.ownerName);
        }
        if (foundData.fatherName) {
          onChange('fatherName', foundData.fatherName);
        }
        if (foundData.prevTax !== undefined) {
          onChange('prevTax', foundData.prevTax);
        }
        if (foundData.PTIN) {
          onChange('PTIN', foundData.PTIN);
        }
        if(foundData?.war){
          onChange('ward' , foundData.ward)
        }
        if(foundData?.wardNumber){
          onChange('wardNumber' , foundData?.wardNumber)
        }

      }, 0);

      setMessage({ 
        text: 'Data loaded successfully!', 
        type: 'success' 
      });

    } catch (err) {
      console.error('[ERROR] in fetchHouseData:', err.message);
      setMessage({ 
        text: `Error: ${err.message}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    onChange(property.path || property.name, value);
    setMessage(null);
  };

  const handleFetchClick = () => {
    fetchHouseData(inputValue);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchHouseData(inputValue);
    }
  };

  return (
    <FormGroup>
      <Label>{property.label}</Label>
      <Box display="flex" alignItems="flex-start" gap="default">
        <Box flex="1">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter house number and press Enter or click Fetch"
            disabled={loading}
          />
        </Box>
        <Button
          onClick={handleFetchClick}
          disabled={loading || !inputValue}
          variant="primary"
          size="default"
        >
          {loading ? 'Searching...' : 'Fetch Data'}
        </Button>
      </Box>
      {message && (
        <Box mt="default">
          <MessageBox
            message={message.text}
            variant={message.type === 'error' ? 'danger' : 'success'}
            size="sm"
          />
        </Box>
      )}
    </FormGroup>
  );
};

export default HouseNumberInput;