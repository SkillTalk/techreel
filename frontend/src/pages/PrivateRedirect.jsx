// src/pages/PrivateRedirect.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PrivateRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user"); // or check token if used
    if (user) {
      navigate("/profile");
    } else {
      navigate("/landing");
    }
  }, [navigate]);

  return null;
};

export default PrivateRedirect;

