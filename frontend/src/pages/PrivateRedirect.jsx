// src/pages/PrivateRedirect.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PrivateRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user"); // or check token if used
    if (user) {
      navigate("/home");
    } else {
      navigate("/landing");
    }
  }, [navigate]);

  return null;
};

export default PrivateRedirect;

