import { useEffect, useState, type ReactNode } from "react";

function themeFromLocation(): string {
  const params = new URLSearchParams(window.location.search);
  const globals = params.get("globals") ?? "";
  const match = /(?:^|,)theme:([^,]+)/.exec(globals);
  return match?.[1] ?? document.documentElement.getAttribute("data-theme") ?? "light";
}

export function DocsThemeSync({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(themeFromLocation);

  useEffect(() => {
    const sync = () => {
      const next = themeFromLocation();
      document.documentElement.setAttribute("data-theme", next);
      setTheme((current) => (current === next ? current : next));
    };

    sync();
    const id = window.setInterval(sync, 250);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      data-theme={theme}
      className="rounded-lg p-4"
      style={{
        background: "var(--ds-color-background)",
        color: "var(--ds-color-foreground)",
      }}
    >
      {children}
    </div>
  );
}
