import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router";

const Protected = ({ children }) => {
  const auth = useSelector((state) => state.auth);
  if (auth.loading) return <div>Loading...</div>;

  if (!auth.user) return <Navigate to="/login" />;

  return children;
};

export default Protected;
