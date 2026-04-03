interface DiffViewerProps {
  diff: string;
}

export default function DiffViewer({ diff }: DiffViewerProps) {
  const lines = diff.split("\n");

  return (
    <div className="font-mono text-xs overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, i) => {
            let bgClass = "";
            let textClass = "text-text-muted";

            if (line.startsWith("+++") || line.startsWith("---")) {
              bgClass = "bg-surface-alt";
              textClass = "text-text font-medium";
            } else if (line.startsWith("@@")) {
              bgClass = "bg-blue-500/10";
              textClass = "text-blue-400";
            } else if (line.startsWith("+")) {
              bgClass = "bg-emerald-500/10";
              textClass = "text-emerald-400";
            } else if (line.startsWith("-")) {
              bgClass = "bg-red-500/10";
              textClass = "text-red-400";
            }

            return (
              <tr key={i} className={bgClass}>
                <td className="px-2 py-0 text-right text-text-muted/40 select-none w-10 align-top">
                  {i + 1}
                </td>
                <td className={`px-3 py-0 whitespace-pre-wrap break-all ${textClass}`}>
                  {line}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
