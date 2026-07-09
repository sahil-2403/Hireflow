import { useEffect, useState } from "react";

const sizeClassNames = {
  xs: "h-8 w-8 text-xs rounded-xl",
  sm: "h-10 w-10 text-sm rounded-xl",
  md: "h-12 w-12 text-base rounded-2xl",
  lg: "h-14 w-14 text-lg rounded-2xl",
  xl: "h-16 w-16 text-2xl rounded-2xl",
};

const getCompanyName = (company, name) => {
  return name || company?.name || "Company";
};

const getCompanyInitial = (companyName) => {
  return companyName.trim().slice(0, 1).toUpperCase() || "C";
};

const CompanyLogo = ({
  company = null,
  src,
  name,
  size = "md",
  className = "",
  imageClassName = "",
  fallbackClassName = "",
}) => {
  const imageUrl = src ?? company?.logoUrl ?? "";

  const companyName = getCompanyName(company, name);

  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl]);

  const sizeClassName = sizeClassNames[size] || sizeClassNames.md;

  const baseClassName = [
    "shrink-0 overflow-hidden border border-slate-200 ring-1 ring-slate-100",
    sizeClassName,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (imageUrl && !hasImageError) {
    return (
      <img
        src={imageUrl}
        alt={`${companyName} logo`}
        onError={() => setHasImageError(true)}
        className={[baseClassName, "bg-white object-cover", imageClassName]
          .filter(Boolean)
          .join(" ")}
      />
    );
  }

  return (
    <div
      className={[
        baseClassName,
        "grid place-items-center bg-blue-50 font-black text-blue-700",
        fallbackClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${companyName} logo`}
      title={companyName}
    >
      {getCompanyInitial(companyName)}
    </div>
  );
};

export default CompanyLogo;
