import { useEffect, useState } from "react";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <main className="min-h-screen bg-background text-foreground p-4">
      <p className="text-sm text-muted-foreground mb-4">Design System Lab token pipeline</p>
      <button
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
        type="button"
        onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
      >
        Switch to {theme === "light" ? "dark" : "light"}
      </button>
    </main>
  );
}
