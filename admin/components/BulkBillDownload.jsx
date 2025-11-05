import React, { useState } from 'react';
import { Box, Button, MessageBox, Loader, Icon, Link } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const BulkBillDownload = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const [mergedPdfUrl , setMergedPdfUrl] = useState('')
  const [isPdfReady , setIsPdfReady] = useState(false);

  const api = new ApiClient();

  const handleDownload = async () => {
    try {
      setLoading(true);
      setMessage(null);

      // Call the backend action
      const response = await api.resourceAction({
        resourceId: 'Property', // Change this to match your actual resource ID in AdminJS
        actionName: 'bulkDownload',
      });

      setLoading(false);

      if (response.data.success) {
        setMessage(response.data.message);
        setMessageType('success');

        setMergedPdfUrl(response.data.downloadUrl)
        setIsPdfReady(true);

        // Open S3 URL in new tab to trigger download
        window.open(response.data.downloadUrl, '_blank');
        
        
        // Alternative method: Force download without opening new tab
        // Uncomment if you prefer this approach:
        /*
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = `AllBills_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        */
      } else {
        setMessage(response.data.message || 'Failed to generate bulk bill');
        setMessageType('error');
      }
    } catch (error) {
      setLoading(false);
      setMessage('Error: ' + (error.message || 'Something went wrong'));
      setMessageType('error');
      console.error('Error downloading bulk bill:', error);
    }
  };

  return (
    <Box padding="xl">
      <Box marginBottom="lg">
        <h2>Download All Property Bills</h2>
        <p>This will merge all property bills into a single PDF file and save it to S3.</p>
      </Box>



      {isPdfReady && <Link>
      {mergedPdfUrl}
      </Link>}

      <Button
        onClick={handleDownload}
        disabled={loading}
        variant="primary"
        size="lg"
      >
        {loading ? (
          <>
            <Loader />
            <span style={{ marginLeft: '10px' }}>Generating PDF...</span>
          </>
        ) : (
          <>
            <Icon icon="Download" />
            <span style={{ marginLeft: '10px' }}>Download All Bills</span>
          </>
        )}
      </Button>

      {message && (
        <Box marginTop="lg">
          <MessageBox
            message={message}
            variant={messageType}
            onCloseClick={() => setMessage(null)}
          />
        </Box>
      )}
    </Box>
  );
};

export default BulkBillDownload;