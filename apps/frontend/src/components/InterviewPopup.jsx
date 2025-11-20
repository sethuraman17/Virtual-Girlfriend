import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const InterviewPopup = ({ setShowPopup }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch("http://localhost:3000/upload-resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload resume.");
      }

      const data = await response.json();
      localStorage.setItem("resumeSummary", JSON.stringify(data.resumeSummary));
      localStorage.setItem("userName", data.userName);
      navigate("/interview");
    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Interview Instructions</h2>
        <p className="mb-4">
          Please upload your resume in PDF or DOCX format to begin the
          interview.
        </p>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="mb-4"
        />
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="flex justify-end">
          <button
            onClick={() => setShowPopup(false)}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload and Start"}
          </button>
        </div>
      </div>
    </div>
  );
};
