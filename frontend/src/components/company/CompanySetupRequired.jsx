import { Building2 } from "lucide-react";

import { Link } from "react-router-dom";

import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";

const CompanySetupRequired = ({
  title = "Create your company profile",
  description = "Set up your company details before managing jobs, applications, recruiters, or analytics.",
}) => {
  return (
    <EmptyState
      icon={Building2}
      title={title}
      description={description}
      action={
        <Button as={Link} to="/company/profile">
          Create company profile
        </Button>
      }
    />
  );
};

export default CompanySetupRequired;
