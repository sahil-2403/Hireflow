import { ROLES } from "./auth.constants";

const getDashboardPathForRole = (role) => {
  if (role === ROLES.CANDIDATE) {
    return "/candidate/dashboard";
  }

  if (role === ROLES.RECRUITER || role === ROLES.OWNER) {
    return "/company/dashboard";
  }

  return "/";
};

export { getDashboardPathForRole };
