import cn from "../../utils/cn";

import { Card } from "../ui/Card";

const AiCard = ({
  as: Component = "section",
  className = "",
  children,
  ...props
}) => {
  return (
    <Card
      as={Component}
      className={cn(
        ["relative", "overflow-hidden", "border-violet-200", "bg-white"].join(
          " ",
        ),
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute inset-x-0 top-0",
          "bg-linear-to-r",
          "from-violet-500",
          "via-indigo-500",
          "to-blue-500",
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute right-0 top-0",
          "h-32 w-32",
          "rounded-full",
          "bg-violet-100/60",
          "blur-3xl",
        ].join(" ")}
      />

      <div className="relative z-10 min-w-0">{children}</div>
    </Card>
  );
};

export default AiCard;
