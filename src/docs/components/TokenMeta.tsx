type TokenMetaItem = {
  label: string;
  value: string;
};

export function TokenMeta({ items }: { items: TokenMetaItem[] }) {
  return (
    <dl className="grid gap-1 text-sm text-foreground m-0">
      {items.map((item) => (
        <div key={item.label} className="grid gap-0.5">
          <dt className="text-muted-foreground text-xs">{item.label}</dt>
          <dd className="m-0 font-mono break-all">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
