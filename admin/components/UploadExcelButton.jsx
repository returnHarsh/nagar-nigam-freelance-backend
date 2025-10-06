import { Button, Box, DropZone } from "@adminjs/design-system";
import { useState } from "react";
import { ApiClient } from "adminjs";

const api = new ApiClient();

const UploadExcelButton = () => {
  const [file, setFile] = useState(null);

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      const base64File = await fileToBase64(file);
      
      const response = await api.resourceAction({
        resourceId: "NagarNigamProperty",
        actionName: "uploadNagarNigamData",
        method: "post",
        data: {
          file: base64File,
          filename: file.name,
          mimetype: file.type
        },
      });

      if (response.data?.notice) {
        alert(response.data.notice.message);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    }
  };

  return (
    <Box>
      <DropZone onChange={(files) => setFile(files[0])} />
      <Button mt="default" onClick={handleUpload} disabled={!file}>
        Upload Excel
      </Button>
    </Box>
  );
};

export default UploadExcelButton;