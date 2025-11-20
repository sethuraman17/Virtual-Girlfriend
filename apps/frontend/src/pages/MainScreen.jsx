import React, { useState } from "react";
import { Link } from "react-router-dom";
import { InterviewPopup } from "../components/InterviewPopup";

export const MainScreen = () => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="flex h-screen">
      <div className="w-1/2 flex items-center justify-center bg-gray-200">
        <Link to="/demo" className="text-2xl font-bold">
          Demo
        </Link>
      </div>
      <div className="w-1/2 flex items-center justify-center bg-gray-300">
        <button
          onClick={() => setShowPopup(true)}
          className="text-2xl font-bold"
        >
          Interview
        </button>
      </div>
      {showPopup && <InterviewPopup setShowPopup={setShowPopup} />}
    </div>
  );
};
