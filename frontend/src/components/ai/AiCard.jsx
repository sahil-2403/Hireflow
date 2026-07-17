import { Card } from "../ui/Card";

const AiCard = ({ as = "section", className = "", children }) => {
  return (
    <Card
      as={as}
      className={[
        "relative overflow-hidden",
        "border-violet-300",
        "shadow-lg shadow-violet-200/50",
        "ring-1 ring-violet-100",
        className,
      ].join(" ")}
    >
      {/* Full-card AI gradient */}
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0",
          "bg-linear-to-br",
          "from-violet-200 via-indigo-100 to-blue-200",
        ].join(" ")}
      />

      {/* Violet decorative glow */}
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute -left-24 -top-23",
          "h-72 w-72 rounded-full",
          "bg-violet-400/25 blur-3xl",
        ].join(" ")}
      />

      {/* Blue decorative glow */}
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute -right-24 -bottom-24",
          "h-72 w-72 rounded-full",
          "bg-blue-400/25 blur-3xl",
        ].join(" ")}
      />

      {/* Soft center highlight */}
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute left-1/3 top-1/3",
          "h-64 w-64 rounded-full",
          "bg-white/30 blur-3xl",
        ].join(" ")}
      />

      <div className="relative z-10">{children}</div>
    </Card>
  );
};

export default AiCard;
