import { useEffect, useState } from "react";

const sizeClassNames = {
  xs: "h-8 w-8 text-xs",
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

const getDisplayName = (user, name) => {
  return (
    name ||
    user?.firstName ||
    user?.username ||
    user?.email ||
    "User"
  );
};

const getInitials = (displayName) => {
  const normalizedName = displayName.replace("@", " ").trim();

  const parts = normalizedName.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return normalizedName.slice(0, 1).toUpperCase() || "U";
};

const ProfileAvatar = ({
  user = null,
  src,
  name,
  size = "md",
  className = "",
  imageClassName = "",
  fallbackClassName = "",
}) => {
  const imageUrl = src ?? user?.profilePhotoUrl ?? "";

  const displayName = getDisplayName(user, name);

  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl]);

  const sizeClassName = sizeClassNames[size] || sizeClassNames.md;

  const baseClassName = [
    "shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200",
    sizeClassName,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (imageUrl && !hasImageError) {
    return (
      <img
        src={imageUrl}
        alt={`${displayName} profile`}
        onError={() => setHasImageError(true)}
        className={[
          baseClassName,
          "object-cover",
          imageClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    );
  }

  return (
    <div
      className={[
        baseClassName,
        "grid place-items-center bg-slate-900 font-bold text-white",
        fallbackClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${displayName} profile`}
      title={displayName}
    >
      {getInitials(displayName)}
    </div>
  );
};

export default ProfileAvatar;