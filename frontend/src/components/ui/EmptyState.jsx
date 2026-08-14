import { isValidElement } from "react";

import { Inbox } from "lucide-react";

import cn from "../../utils/cn";

const SIZE_CLASS_NAMES = {
  compact: {
    container: "p-4 sm:p-5",

    iconContainer: "h-10 w-10 rounded-xl",

    icon: "h-5 w-5",

    title: "mt-3 text-base",

    description: "mt-1 text-sm",

    action: "mt-4",
  },

  default: {
    container: "p-6 sm:p-8",

    iconContainer: "h-12 w-12 rounded-xl",

    icon: "h-6 w-6",

    title: "mt-4 text-lg",

    description: "mt-2 text-sm",

    action: "mt-5",
  },
};

const EmptyState = ({
  icon: iconValue = Inbox,
  title,
  description,
  action,
  size = "default",
  className = "",
}) => {
  const resolvedSize = SIZE_CLASS_NAMES[size] ? size : "default";

  const sizeClasses = SIZE_CLASS_NAMES[resolvedSize];

  const renderIcon = () => {
    if (isValidElement(iconValue)) {
      return iconValue;
    }

    const IconComponent = iconValue;

    return <IconComponent className={sizeClasses.icon} aria-hidden="true" />;
  };

  return (
    <section
      className={cn(
        [
          "rounded-2xl",
          "border border-slate-200",
          "bg-white",
          "text-center",
        ].join(" "),

        sizeClasses.container,

        className,
      )}
    >
      <div
        className={cn(
          [
            "mx-auto grid",
            "place-items-center",
            "bg-blue-50",
            "text-blue-700",
          ].join(" "),

          sizeClasses.iconContainer,
        )}
      >
        {renderIcon()}
      </div>

      <h2
        className={cn(
          ["font-semibold", "leading-6", "text-slate-950"].join(" "),

          sizeClasses.title,
        )}
      >
        {title}
      </h2>

      {description && (
        <p
          className={cn(
            ["mx-auto", "max-w-lg", "leading-6", "text-slate-600"].join(" "),

            sizeClasses.description,
          )}
        >
          {description}
        </p>
      )}

      {action && (
        <div className={cn("flex justify-center", sizeClasses.action)}>
          {action}
        </div>
      )}
    </section>
  );
};

export default EmptyState;
