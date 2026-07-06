const Card = ({ as: Component = "section", className = "", children }) => {
  return (
    <Component
      className={[
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      ].join(" ")}
    >
      {children}
    </Component>
  );
};

const CardHeader = ({ className = "", children }) => {
  return (
    <div className={["border-b border-slate-100 p-5", className].join(" ")}>
      {children}
    </div>
  );
};

const CardBody = ({ className = "", children }) => {
  return <div className={["p-5", className].join(" ")}>{children}</div>;
};

const CardFooter = ({ className = "", children }) => {
  return (
    <div
      className={[
        "border-t border-slate-100 bg-slate-50/80 p-4",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardBody, CardFooter };
