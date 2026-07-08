import { ROLES } from "../features/auth/auth.constants";

const roleDisplayNames = {
  [ROLES.CANDIDATE]: "Candidate",
  [ROLES.RECRUITER]: "Recruiter",
  [ROLES.OWNER]: "Company admin",
};

const getRoleDisplayName = (role) => {
  return roleDisplayNames[role] || "User";
};

export default getRoleDisplayName;
