/** Team-Anzeige: Wappen (falls vorhanden) + Name/Kürzel. */
export function TeamBadge({
  name,
  code,
  crest,
  align = 'left',
}: {
  name: string;
  code?: string | null;
  crest?: string | null;
  align?: 'left' | 'right';
}) {
  const img = crest ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={crest} alt="" className="h-6 w-6 object-contain" />
  ) : (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[10px] font-bold">
      {(code ?? name).slice(0, 3).toUpperCase()}
    </span>
  );
  return (
    <span
      className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}
    >
      {img}
      <span className="truncate font-medium">{name}</span>
    </span>
  );
}
