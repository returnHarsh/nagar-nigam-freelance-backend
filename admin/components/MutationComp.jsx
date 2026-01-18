import React, { useState } from 'react';
import { Box, Button, Input, Label, MessageBox, Loader } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const PTINPropertyComponent = (props) => {
  const { resource , onChange} = props;
  
  // Configuration: Add/remove fields here for mutation
  const MUTABLE_FIELDS = ['ownerName', 'fatherName'];
  
  const [ptin, setPtin] = useState('');
  const [loading, setLoading] = useState(false);
  const [propertyRecordsData, setPropertyRecordsData] = useState(null);
  const [mutatedFields, setMutatedFields] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const api = new ApiClient();

  const handleFetchDetails = async () => {
    if (!ptin.trim()) {
      setError('Please enter a PTIN number');
      return;
    }

    setLoading(true);
    setError(null);
    setPropertyRecordsData(null);
    setMutatedFields({});
    setSuccessMessage(null);

    try {
      const response = await api.resourceAction({
        resourceId: resource.id,
        actionName: 'getPropertyDetailsByPTIN',
        params: { ptin }
      });
      
      console.log("response is : ", response);

      if (response.data && response.data.record) {
        const propertyData = response.data.record?.property;
        setPropertyRecordsData(propertyData);
        
        // Initialize mutatedFields with current values from fetched data
        const initialMutatedFields = {};
        MUTABLE_FIELDS.forEach(field => {
          initialMutatedFields[field] = propertyData?.[field] || '';
        });
        setMutatedFields(initialMutatedFields);
      } else {
        setError('No property found with this PTIN');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch property details');
    } finally {
      setLoading(false);
    }
  };

  console.log("Modified fields are : " ,  mutatedFields)

  const handleFieldChange = (fieldName, value) => {
    setMutatedFields(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async () => {
    if (!propertyRecordsData || !propertyRecordsData._id) {
      setError('No property data available to submit');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const preparedBody = MUTABLE_FIELDS.map(fieldName=>{
      if(propertyRecordsData[fieldName] === mutatedFields[fieldName]) return undefined
      return {fieldName : fieldName , oldValue : propertyRecordsData[fieldName] , newValue : mutatedFields[fieldName]}
    }).filter(Boolean)

    try {

      // sending the request to register the data.. using custom component
      const response = await api.resourceAction({
        resourceId: resource.id,
        actionName: 'saveMutatedValues',
        params: {
          ptin: ptin,
          mutatedFields : preparedBody
        }
      });

      onChange('modifiedFields' , preparedBody)
      setSuccessMessage('Property details updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to format field names for display
  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  return (
    <Box padding="xl">
      <Box marginBottom="xl">
        <Label>PTIN Number</Label>
        <Box display="flex" gap="default" marginTop="sm">
          <Input
            value={ptin}
            onChange={(e) => setPtin(e.target.value)}
            placeholder="Enter PTIN number"
            disabled={loading}
          />
          <Button
          type='button'
            onClick={handleFetchDetails}
            disabled={loading}
          >
            {loading ? <Loader /> : 'Fetch Details'}
          </Button>
        </Box>
      </Box>

      {error && (
        <MessageBox
          message={error}
          variant="danger"
          onCloseClick={() => setError(null)}
          marginBottom="xl"
        />
      )}

      {successMessage && (
        <MessageBox
          message={successMessage}
          variant="success"
          onCloseClick={() => setSuccessMessage(null)}
          marginBottom="xl"
        />
      )}

      {propertyRecordsData && (
        <Box
          border="default"
          borderRadius="default"
          padding="xl"
          marginTop="xl"
        >
          {MUTABLE_FIELDS.map((fieldName) => (
            <Box key={fieldName} marginBottom="lg">
              <Label>{formatFieldName(fieldName)}</Label>
              <Box display="flex" gap="lg" alignItems="center" marginTop="sm">
                <Box flex="1">
                  <strong>Current : </strong> {propertyRecordsData[fieldName] || 'N/A'}
                </Box>
                <Box flex="1">
                  <Input
                    value={mutatedFields[fieldName] || ''}
                    onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                    placeholder={`Enter new ${formatFieldName(fieldName).toLowerCase()}`}
                  />
                </Box>
              </Box>
            </Box>
          ))}

          <Box marginTop="xl">
            <Button
              type='button'
              onClick={handleSubmit}
              disabled={submitting}
              // variant="primary"
            >
              {submitting ? <Loader /> : 'Submit Changes'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PTINPropertyComponent;