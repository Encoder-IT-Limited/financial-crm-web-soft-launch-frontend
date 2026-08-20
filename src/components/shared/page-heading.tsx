export function PageHeading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold text-text sm:text-[22px] min-[1440px]:text-[24px]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-text-3 min-[1440px]:text-[13.5px]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
