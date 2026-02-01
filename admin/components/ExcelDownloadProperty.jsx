import React, { useState } from 'react';
import { Box, Button, MessageBox, Loader, Icon, Link } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const BulkBillDownload = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const [mergedPdfUrl, setMergedPdfUrl] = useState('')
  const [wardNumber, setWardNumber] = useState();

  const api = new ApiClient();

  //   const handleDownload = async () => {
  //     try {
  //       setLoading(true);
  //       setMessage(null);

  //       // Call the backend action
  //       const response = await api.resourceAction({
  //         resourceId: 'Property', // Change this to match your actual resource ID in AdminJS
  //         actionName: 'downloadExcel',
  //         params : {wardNumber}
  //       });

  //       setLoading(false);

  //       if (response.data.success) {
  //         setMessage(response.data.message);
  //         setMessageType('success');


  //         // Open S3 URL in new tab to trigger download
  //         // window.open(response.data.downloadUrl, '_blank');


  //         // Alternative method: Force download without opening new tab
  //         // Uncomment if you prefer this approach:
  //         /*
  //         const link = document.createElement('a');
  //         link.href = response.data.downloadUrl;
  //         link.download = `AllBills_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;
  //         link.target = '_blank';
  //         document.body.appendChild(link);
  //         link.click();
  //         document.body.removeChild(link);
  //         */
  //       } else {
  //         setMessage(response.data.message || 'Failed to generate bulk bill');
  //         setMessageType('error');
  //       }
  //     } catch (error) {
  //       setLoading(false);
  //       setMessage('Error: ' + (error.message || 'Something went wrong'));
  //       setMessageType('error');
  //       console.error('Error downloading bulk bill:', error);
  //     }
  //   };



  const handleDownload = async () => {
    if (!wardNumber) {
      setMessage("Please select a ward number");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch(
        `https://api.npup.in/ghiror/admin-internals/properties-download/${wardNumber}`,
        {
          method: "GET",
          credentials: "include", // 🔥 important if auth/cookies involved
        }
      )

      console.log("res is : " , res)

      if (!res.ok) {
        throw new Error("Failed to download file")
      }

      const blob = await res.blob()

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")

      a.href = url
      a.download = `properties_ward_${wardNumber}.xlsx`
      document.body.appendChild(a)
      a.click()

      a.remove()
      window.URL.revokeObjectURL(url)

      setMessage("Excel download started");
      setMessageType("success");
    } catch   (err) {
      console.error("Download error:", err.message);
      setMessage("Failed to download Excel or The properties does not exists for this ward Number");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      <Box padding="xl">
        <Box marginBottom="lg">
          <h2>Download All Property Bills</h2>
          <p>This will merge all property bills into a single PDF file and save it to S3.</p>
        </Box>

        {/* 👇 Input Field for User Number */}
        <Box marginBottom="lg">
          <label htmlFor="userNumber">Enter Number:</label>
          <input
            id="userNumber"
            type="number"
            value={wardNumber}
            onChange={(e) => setWardNumber(e.target.value)}
            placeholder="Enter a number"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginTop: "8px",
            }}
          />
        </Box>

        <Button
          onClick={handleDownload}
          disabled={loading}
          variant="primary"
          size="lg"
        >
          {loading ? (
            <>
              <Loader />
              <span style={{ marginLeft: "10px" }}> Downloading Excel... </span>
            </>
          ) : (
            <>
              <Icon icon="Download" />
              <span style={{ marginLeft: "10px" }}> Download Excel for ward {wardNumber} </span>
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
    </>
  )
}

export default BulkBillDownload;