// File: components/ImportPropertiesComponent.jsx
import React, { useState } from 'react';
import { Box, Button, Icon, Text, Loader, MessageBox } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const UploadBulkProperties = (props) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const api = new ApiClient();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xlsx')) {
        setError('Please upload a valid Excel file (.xlsx)');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

    const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // const formData = new FormData();
      // formData.append('uploadedFile', file);
      const base64File = await fileToBase64(file);

      const response = await api.resourceAction({
        resourceId: props.resource.id,
        actionName: 'importPropertiesWithUI',
        data: {
          file : base64File,
          fileName : file?.name
        },
        method: 'post'
      });


      if (response.data.notice?.type === 'success') {
        setResult({
          message: response.data.notice.message,
          stats: response.data.record?.params || {}
        });
        setFile(null);
        
        // Clear file input
        const fileInput = document.getElementById('excel-file-input');
        if (fileInput) fileInput.value = '';
      } else {
        setError(response.data.notice?.message || 'Upload failed');
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box padding="xxl">
      <Box marginBottom="xl">
        <Text fontSize="h3" fontWeight="bold">
          Import Properties from Excel
        </Text>
        <Text marginTop="default" color="grey60">
          Upload an Excel file to import property data into the database
        </Text>
      </Box>

      {/* File Upload Section */}
      <Box
        padding="xl"
        border="default"
        borderRadius="default"
        marginBottom="xl"
        style={{
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}
      >
        <input
          id="excel-file-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={uploading}
          style={{
            display: 'block',
            margin: '0 auto 20px',
            padding: '10px',
            border: '2px dashed #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        />

        {file && (
          <Box marginBottom="default">
            <Text>
              <Icon icon="File" style={{ marginRight: '8px' }} />
              Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
            </Text>
          </Box>
        )}

        <Button
          variant="primary"
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{ minWidth: '200px' }}
        >
          {uploading ? (
            <>
              <Loader style={{ marginRight: '8px' }} />
              Importing...
            </>
          ) : (
            <>
              <Icon icon="Upload" style={{ marginRight: '8px' }} />
              Upload & Import
            </>
          )}
        </Button>
      </Box>

      {/* Success Message */}
      {result && (
        <MessageBox
          message={result.message}
          variant="success"
          icon="CheckCircle"
        >
          <Box marginTop="default">
            <Text><strong>Import Statistics:</strong></Text>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>Total Processed: {result.stats.totalProcessed || 0}</li>
              <li>Successfully Imported: {result.stats.importedCount || 0}</li>
              <li>Duplicates Skipped: {result.stats.duplicatesSkipped || 0}</li>
            </ul>
          </Box>
        </MessageBox>
      )}

      {/* Error Message */}
      {error && (
        <MessageBox
          message={error}
          variant="danger"
          icon="AlertCircle"
        />
      )}

      {/* Instructions */}
      <Box marginTop="xl" padding="lg" border="default" borderRadius="default">
        <Text fontSize="h5" fontWeight="bold" marginBottom="default">
          📋 Instructions:
        </Text>
        <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>Prepare your Excel file with the required columns</li>
          <li>Click "Choose File" to select your Excel file</li>
          <li>Click "Upload & Import" to start the import process</li>
          <li>Wait for the process to complete</li>
          <li>Review the import statistics</li>
        </ol>

        <Text fontSize="h5" fontWeight="bold" marginTop="lg" marginBottom="default">
          📝 Required Excel Columns:
        </Text>
        <ul style={{ paddingLeft: '20px', lineHeight: '1.6', fontSize: '14px' }}>
          <li>WARD NUMBER</li>
          <li>HOUSE_NUMBER</li>
          <li>Phone number</li>
          <li>FATHER NAME</li>
          <li>RODE WITH TAPE- NAME</li>
          <li>CONSTRUCTION TYPE NAME</li>
          <li>PROPERTY TYPE NAME</li>
          <li>PROPERTY CATEGORY</li>
          <li>NUMBER OF FLOOR</li>
          <li>Comment</li>
          <li>Empty_Area_Commercial</li>
          <li>Residential_Empty_Area</li>
          <li>Commercial_Coppate_Area_Floor1, Floor2, etc.</li>
          <li>Residential_Coppate_Area_Floor1, Floor2, etc.</li>
        </ul>
      </Box>
    </Box>
  );
};

export default UploadBulkProperties;