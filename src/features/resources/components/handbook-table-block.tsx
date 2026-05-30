/**
 * Renders a table ContentBlock from the handbook JSON.
 * Wrapped in overflow-x-auto for mobile responsiveness.
 * Server component — no interactivity needed.
 */

interface Props {
  headers: string[];
  rows: string[][];
}

export function HandbookTableBlock({ headers, rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 my-4">
      <table className="w-full text-sm">
        {headers.length > 0 && (
          <thead>
            <tr className="border-b border-border/60 bg-muted/40">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-border/50">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/20 transition-colors">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-4 py-2.5 text-muted-foreground leading-relaxed"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
