import { useNavigate } from "react-router-dom";

import { logout } from "../api/auth.api";
import useAuth from "./useAuth";

const useLogout = () => {
  const navigate = useNavigate();

  const { accessToken, refreshToken, signOut } = useAuth();

  const logoutUser = async () => {
    try {
      if (accessToken && refreshToken) {
        await logout({
          accessToken,
          refreshToken,
        });
      }
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
