import { Card, CardBody } from "../ui/Card";

const toneClasses = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

const CompanyMetricCard = ({
  label,
  value,
  helperText,
  icon = "📊",
  tone = "blue",
}) => {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <CardBody className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-500">{label}</p>

            <p className="mt-3 text-3xl font-black text-slate-950">
              {value ?? 0}
            </p>
          </div>

          <div
            className={[
              "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl ring-1",
              toneClasses[tone] || toneClasses.blue,
            ].join(" ")}
          >
            {icon}
          </div>
        </div>

        {helperText && (
          <p className="mt-3 text-sm leading-6 text-slate-500">{helperText}</p>
        )}
      </CardBody>
    </Card>
  );
};

export default CompanyMetricCard;
