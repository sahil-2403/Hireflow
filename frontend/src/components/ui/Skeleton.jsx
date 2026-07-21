import cn from "../../utils/cn";

const Skeleton = ({ className = "", ...props }) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        [
          "animate-pulse",
          "rounded-lg",
          "bg-slate-200/80",
          "motion-reduce:animate-none",
        ].join(" "),
        className,
      )}
      {...props}
    />
  );
};

export default Skeleton;
