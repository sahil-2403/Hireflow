import { Toaster } from "sonner";

const AppToaster = () => {
  return (
    <Toaster
      position="top-center"
      expand
      richColors={false}
      visibleToasts={3}
      gap={10}
      offset={76}
      mobileOffset={{
        top: 72,
        left: 16,
        right: 16,
      }}
      containerAriaLabel="HireFlow notifications"
      style={{
        display: "flex",
        justifyContent: "center",
      }}
      toastOptions={{
        style: {
          width: "min(420px, calc(100vw - 32px))",

          marginInline: "auto",
        },

        classNames: {
          toast: [
            "!flex",
            "!items-center",
            "!gap-3",
            "!border",
            "!border-slate-200",
            "!bg-white",
            "!px-4",
            "!py-3",
            "!text-slate-900",
            "!shadow-lg",
            "!shadow-slate-200/60",
          ].join(" "),

          content: ["!min-w-0", "!flex-1"].join(" "),

          title: ["!text-sm", "!font-semibold", "!text-slate-900"].join(" "),

          description: [
            "!mt-0.5",
            "!text-xs",
            "!leading-5",
            "!text-slate-600",
          ].join(" "),

          success: "!border-emerald-200",

          error: "!border-red-200",

          warning: "!border-amber-200",

          info: "!border-blue-200",

          actionButton: [
            "!ml-auto",
            "!grid",
            "!h-8",
            "!w-8",
            "!shrink-0",
            "!place-items-center",
            "!rounded-lg",
            "!border",
            "!border-slate-200",
            "!bg-white",
            "!p-0",
            "!text-slate-500",
            "!shadow-none",
            "hover:!bg-slate-50",
            "hover:!text-slate-900",
            "focus-visible:!outline-none",
            "focus-visible:!ring-2",
            "focus-visible:!ring-blue-500",
          ].join(" "),
        },
      }}
    />
  );
};

export default AppToaster;
