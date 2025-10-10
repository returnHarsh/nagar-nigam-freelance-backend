// components/PropertyWardSelector.jsx
// Custom component with locality as single-select dropdown

import React, { useState, useEffect } from 'react';
import { FormGroup, Label, Select, Input, Box, Button } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const PropertyWardSelector = (props) => {
  const { property, record, onChange } = props;
  
  // State management
  const [wardOptions, setWardOptions] = useState([]);
  const [localityOptions, setLocalityOptions] = useState([]);
  const [selectedWard, setSelectedWard] = useState(record?.params?.ward || '');
  const [wardNumber, setWardNumber] = useState(record?.params?.wardNumber || '');
  const [selectedLocality, setSelectedLocality] = useState(record?.params?.locality || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize ApiClient
  const api = new ApiClient();

  // Fetch ward data when component mounts
  useEffect(() => {
    fetchWardData();
  }, []);

  // Initialize fields if editing existing record
  useEffect(() => {
    if (record?.params) {
      setSelectedWard(record.params.ward || '');
      setWardNumber(record.params.wardNumber || '');
      setSelectedLocality(record.params.locality || '');
    }
  }, [record]);

  // Fetch all wards using custom action
  const fetchWardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call your custom action
      const response = await api.resourceAction({
        resourceId: 'PropertyWardDetail',
        actionName: 'getWardDetails',
        params: {},
      });

      console.log('API Response:', response);

      // Check if data was returned successfully
      if (response.data && response.data?.data?.propertyWardDetail) {
        const wardData = response.data?.data?.propertyWardDetail;
        
        // Create unique ward options
        const uniqueWards = [];
        const wardMap = new Map();
        
        wardData.forEach(item => {
          const wardName = item.ward;
          const wardNum = item.wardNumber;
          const localities = item.locality; // This is an array of localities for this ward
          
          if (!wardMap.has(wardName)) {
            wardMap.set(wardName, {
              value: wardName,
              label: wardName,
              wardNumber: wardNum,
              localities: Array.isArray(localities) ? localities : [localities],
            });
            uniqueWards.push(wardMap.get(wardName));
          }
        });
        
        // Sort alphabetically
        uniqueWards.sort((a, b) => a.label.localeCompare(b.label));
        
        setWardOptions(uniqueWards);
      } else if (response.data && response.data.error) {
        throw new Error(response.data.error);
      } else {
        throw new Error('No ward data returned');
      }
    } catch (err) {
      console.error('Error fetching ward data:', err);
      setError(err.message || 'Failed to fetch ward data');
    } finally {
      setLoading(false);
    }
  };

  // Handle ward selection change
  const handleWardChange = (selected) => {
    if (!selected) {
      // User cleared the selection
      setSelectedWard('');
      setWardNumber('');
      setLocalityOptions([]);
      setSelectedLocality('');
      
      // Update AdminJS form
      if (onChange) {
        onChange('ward', '');
        onChange('wardNumber', '');
        onChange('locality', '');
      }
      return;
    }

    // Find the selected ward data
    const selectedWardData = wardOptions.find(opt => opt.value === selected.value);
    
    if (selectedWardData) {
      // Update local state
      setSelectedWard(selectedWardData.value);
      setWardNumber(selectedWardData.wardNumber);
      
      // Create locality options for the dropdown
      const localityOpts = selectedWardData.localities.map(loc => ({
        value: loc,
        label: loc,
      }));
      setLocalityOptions(localityOpts);
      
      // Clear previously selected locality
      setSelectedLocality('');

      // Update AdminJS form values
      if (onChange) {
        onChange('ward', selectedWardData.value);
        onChange('wardNumber', selectedWardData.wardNumber);
        onChange('locality', ''); // Clear locality when ward changes
      }
    }
  };

  // Handle locality selection change (SINGLE SELECT)
  const handleLocalityChange = (selected) => {
    console.log("selected locality is:", selected);
    
    // For single select, selected is a single {value, label} object or null
    const selectedValue = selected ? selected.value : '';
    
    setSelectedLocality(selectedValue);
    
    // Update AdminJS form
    if (onChange) {
      onChange('locality', selectedValue);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box p="xl" style={{ textAlign: 'center' }}>
        <p>Loading ward data...</p>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p="xl" style={{ 
        color: '#d32f2f', 
        backgroundColor: '#ffebee',
        borderRadius: '4px',
        padding: '16px'
      }}>
        <p><strong>Error:</strong> {error}</p>
        <Button onClick={fetchWardData} size="sm" variant="primary" mt="default">
          Retry
        </Button>
      </Box>
    );
  }

  // No data state
  if (wardOptions.length === 0) {
    return (
      <Box p="xl" style={{ 
        backgroundColor: '#fff3e0',
        borderRadius: '4px',
        padding: '16px'
      }}>
        <p>No ward data available. Please upload ward details first.</p>
        <Button onClick={fetchWardData} size="sm" variant="primary" mt="default">
          Refresh
        </Button>
      </Box>
    );
  }

  // Main component render
  return (
    <Box>
      {/* Ward Dropdown */}
      <FormGroup>
        <Label required>Select Ward</Label>
        <Select
          value={selectedWard ? { value: selectedWard, label: selectedWard } : null}
          options={wardOptions}
          onChange={handleWardChange}
          isClearable
          isSearchable
          placeholder="Choose a ward..."
          styles={{
            control: (base) => ({
              ...base,
              minHeight: '40px',
            }),
          }}
        />
        {wardOptions.length > 0 && (
          <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
            {wardOptions.length} wards available
          </small>
        )}
      </FormGroup>

      {/* Ward Number - Auto-filled */}
      <FormGroup mt="default">
        <Label>Ward Number</Label>
        <Input
          value={wardNumber}
          disabled
          placeholder="Will be auto-filled"
          style={{ 
            backgroundColor: '#f5f5f5',
            cursor: 'not-allowed',
            color: '#666',
          }}
        />
      </FormGroup>

      {/* Locality - Single-select Dropdown */}
      {localityOptions.length > 0 && (
        <FormGroup mt="default">
          <Label required>Select Locality</Label>
          <Select
            value={selectedLocality ? { value: selectedLocality, label: selectedLocality } : null}
            options={localityOptions}
            onChange={handleLocalityChange}
            isClearable
            isSearchable
            placeholder="Choose a locality..."
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '40px',
              }),
            }}
          />
          <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
            {localityOptions.length} localities available for this ward
          </small>
        </FormGroup>
      )}

      {/* Info box showing selected values */}
      {selectedWard && (
        <Box 
          mt="default" 
          p="default" 
          style={{ 
            backgroundColor: '#e3f2fd', 
            borderLeft: '4px solid #2196f3',
            borderRadius: '4px',
          }}
        >
          <p style={{ margin: 0, fontSize: '14px' }}>
            <strong>Selected Ward:</strong> {selectedWard} | 
            <strong> Ward #:</strong> {wardNumber}
            {selectedLocality && (
              <>
                {' | '}
                <strong> Locality:</strong> {selectedLocality}
              </>
            )}
          </p>
        </Box>
      )}
    </Box>
  );
};

export default PropertyWardSelector;