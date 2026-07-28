import { useNavigate } from "react-router-dom";

import { logout, logoutAllDevices } from "../api/auth.api";

import useAuth from "./useAuth";

const useLogout = () => {
  const navigate = useNavigate();

  const { signOut } = useAuth();

  const logoutUser = async ({ logoutFromAllDevices = false } = {}) => {
    const result = logoutFromAllDevices
      ? await logoutAllDevices()
      : await logout();

    /*
     * Local authentication state is cleared only
     * after the server successfully revokes the
     * requested session or sessions.
     *
     * Errors are intentionally allowed to propagate
     * to the confirmation dialog.
     */
    signOut();

    navigate("/login", {
      replace: true,
      state: {
        message: logoutFromAllDevices
          ? "You have been logged out from all devices."
          : "You have been logged out successfully.",
      },
    });

    return result;
  };

  return {
    logoutUser,
  };
};

export default useLogout;
