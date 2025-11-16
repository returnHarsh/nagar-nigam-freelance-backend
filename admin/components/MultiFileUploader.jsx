import React, { useState, useRef } from "react";
import { ApiClient } from "adminjs";

const api = new ApiClient();

const MultiFileUploader = ({ onChange }) => {
  const [uploadingField, setUploadingField] = useState(null);
  const [uploadedUrls, setUploadedUrls] = useState({});
  const fileFields = [
    { key: "receiptWithSign", label: "Receipt With Sign" },
    { key: "ownerInterviewer", label: "Owner Interviewer" },
    { key: "IDProof", label: "ID Proof" },
    { key: "houseFrontWithNamePlate", label: "House Front With Name Plate" },
  ];

  // Refs for hidden file inputs
  const inputRefs = useRef({});

  const handleFileChange = async (event, fieldKey) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File must be smaller than 5 MB");
      return;
    }

    setUploadingField(fieldKey);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;
        const response = await api.resourceAction({
          resourceId: "Property",
          actionName: "uploadToS3",
          method: "post",
          data: {
            fileName: file.name,
            fileType: file.type,
            fileData: base64Data,
            field: fieldKey,
          },
        });

        if (!response.data) throw new Error("No response from server");

        const fileUrl = response.data?.data?.fileUrl;
        if (fileUrl) {
          onChange(fieldKey, fileUrl);
          setUploadedUrls((prev) => ({ ...prev, [fieldKey]: fileUrl }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("Upload failed. Check console for details.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemove = (key) => {
    setUploadedUrls((prev) => {
      const updated = { ...prev };
      delete updated[key];
      onChange(key, null);
      return updated;
    });
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "700px", margin: "0 auto" }}>
      <h3 style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        Upload Property Images
      </h3>
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        }}
      >
        {fileFields.map(({ key, label }) => (
          <div
            key={key}
            style={{
              border: "1px dashed #aaa",
              borderRadius: "12px",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              cursor: "pointer",
              transition: "box-shadow 0.3s",
            }}
            onClick={() => inputRefs.current[key]?.click()}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "none")
            }
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={(el) => (inputRefs.current[key] = el)}
              onChange={(e) => handleFileChange(e, key)}
              style={{ display: "none" }} // hide the default input
            />

            {uploadedUrls[key] ? (
              <>
                <div style={{ position: "relative" }}>
                  <img
                    src={uploadedUrls[key]}
                    alt={label}
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(key);
                    }}
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      background: "red",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      cursor: "pointer",
                    }}
                  >
                    &times;
                  </button>
                </div>
                <a
                  href={uploadedUrls[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginTop: "0.5rem",
                    color: "#007bff",
                    textDecoration: "underline",
                  }}
                >
                  View Full Image
                </a>
              </>
            ) : uploadingField === key ? (
              <p style={{ fontStyle: "italic", color: "#555" }}>Uploading...</p>
            ) : (
              <p style={{ color: "#777", textAlign: "center" }}>
                Click here to upload <br /> {label}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiFileUploader;
