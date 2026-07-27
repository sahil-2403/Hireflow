import LoadingIndicator from "./LoadingIndicator";

const PageLoader = ({ message = "Loading HireFlow" }) => {
  return (
    <LoadingIndicator label={message} className="min-h-dvh bg-slate-50 px-4" />
  );
};

export default PageLoader;
