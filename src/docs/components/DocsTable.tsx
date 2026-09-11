type DocsTableProps = {
  caption: string;
  headers: string[];
  rows: string[][];
};

export function DocsTable({ caption, headers, rows }: DocsTableProps) {
  return (
    <table className="w-full text-sm text-left border-collapse" style={{ color: "#111827" }}>
      <caption className="text-left mb-2" style={{ color: "#4b5563" }}>
        {caption}
      </caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th
              key={header}
              className="p-2 font-medium"
              style={{ border: "1px solid #e5e7eb", background: "#f3f4f6", color: "#374151" }}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.join("-")}>
            {row.map((cell) => (
              <td key={cell} className="p-2 font-mono" style={{ border: "1px solid #e5e7eb" }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
