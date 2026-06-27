import { useNavigate } from "react-router-dom";

import { logout } from "../api/auth.api";
import useAuth from "./useAuth";

const useLogout = () => {
  const navigate = useNavigate();

  const { signOut } = useAuth();

  const logoutUser = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      signOut();

      navigate("/login", {
        replace: true,
        state: {
          message: "You have been logged out successfully.",
        },
      });
    }
  };

  return {
    logoutUser,
  };
};

export default useLogout;
