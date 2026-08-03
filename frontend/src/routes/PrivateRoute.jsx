import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { useEffect, useRef } from "react";

function PrivateRoute({ children, requiredModule }) {
  const { user, loading, hasModuleAccess } = useAuth();
  const toastShownRef = useRef(false);

  useEffect(() => {
    // Reset toast flag when component unmounts
    return () => {
      toastShownRef.current = false;
    };
  }, []);

  // Show loading while checking auth
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check module access if required
  if (requiredModule && !hasModuleAccess(requiredModule)) {
    // Show toast only once
    if (!toastShownRef.current) {
      toastShownRef.current = true;
      toast.error(`Access denied. You don't have permission to access this module.`);
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PrivateRoute;