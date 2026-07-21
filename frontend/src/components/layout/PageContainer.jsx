import cn from "../../utils/cn";

const PageContainer = ({
  as: Component = "div",
  className = "",
  children,
  ...props
}) => {
  return (
    <Component
      className={cn(
        [
          "mx-auto w-full",
          "min-w-0",
          "max-w-350",
          "px-4 py-5",
          "sm:px-6 sm:py-6",
          "lg:px-8 lg:py-7",
        ].join(" "),
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

export default PageContainer;
