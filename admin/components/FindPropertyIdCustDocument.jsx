import React, { useState } from 'react';
import { ApiClient } from 'adminjs';

const api = new ApiClient();

const FindPropertyIdCustDocument = (props) => {
  const { record, onChange, property } = props;
  const [ptin, setPtin] = useState('');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ptin) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/admin-internals/get-property-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ PTIN: ptin }), // changed to PTIN
      });

      let data = await res.json();
      data = data?.data;

      if (!data?.propertyId) {
        setDetails(null);
        setError('Property not found');
        return;
      }

      // Set propertyId in AdminJS
      onChange('propertyId', data.propertyId);

      // Show other details
      setDetails({
        ward: data.ward,
        ownerName: data.ownerName,
        fatherName: data.fatherName,
        aadharNumber: data.aadharNumber,
        wardNumber : data.wardNumber
      });
    } catch (err) {
      console.error(err);
      setDetails(null);
      setError('Something went wrong while fetching property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: 'Arial, sans-serif', margin: '20px 0' }}>

      {/* Search Box */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Enter PTIN"
          value={ptin}
          onChange={(e) => setPtin(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            fontSize: '14px',
          }}
        />
        <button
          type='button'
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ color: 'red', fontSize: '13px', fontWeight: 'bold' }}>
          {error}
        </div>
      )}

      {/* Property Details */}
      {details && (
        <div style={{
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          backgroundColor: '#f9f9f9',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px',
        }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>Ward:</span> {details.ward}
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Owner Name:</span> {details.ownerName}
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Father Name:</span> {details.fatherName}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontWeight: 'bold' }}>Aadhar Number:</span> {details.aadharNumber}
          </div>
        </div>
      )}
    </div>
  );
};

export default FindPropertyIdCustDocument;
