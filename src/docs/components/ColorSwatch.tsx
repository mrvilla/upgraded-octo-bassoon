import { useEffect, useRef, useState } from "react";
import { contrastInk } from "./contrastInk.ts";
import { TokenMeta } from "./TokenMeta.tsx";

type TokenMetaItem = {
  label: string;
  value: string;
};

type ColorSwatchProps = {
  path: string;
  cssVar: string;
  resolvedValue?: string;
  background: string;
  label: string;
  extraItems?: TokenMetaItem[];
};

function isTransparent(color: string | undefined): boolean {
  if (!color) {
    return false;
  }
  const normalized = color.trim().toLowerCase();
  return (
    normalized === "transparent" ||
    normalized === "rgba(0, 0, 0, 0)" ||
    /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0(?:\.0+)?\s*\)/.test(normalized)
  );
}

function formatCssColor(color: string): string {
  const match = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(color.trim());
  if (!match || !match[1] || !match[2] || !match[3]) {
    return color;
  }
  const red = Number(match[1]);
  const green = Number(match[2]);
  const blue = Number(match[3]);
  const alpha = match[4] === undefined ? 1 : Number(match[4]);
  if (alpha < 1) {
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function ColorSwatch({
  path,
  cssVar,
  resolvedValue,
  background,
  label,
  extraItems = [],
}: ColorSwatchProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [computedValue, setComputed] = useState<string | undefined>(resolvedValue);

  useEffect(() => {
    if (resolvedValue) {
      setComputed(resolvedValue);
      return;
    }

    const el = surfaceRef.current;
    if (!el) {
      return;
    }

    const read = () => {
      setComputed(formatCssColor(getComputedStyle(el).backgroundColor));
    };
    read();

    const roots = [document.documentElement, el.closest("[data-theme]")].filter(
      (node): node is Element => node instanceof Element,
    );
    const observer = new MutationObserver(read);
    for (const root of roots) {
      observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    }
    return () => observer.disconnect();
  }, [resolvedValue, background]);

  const displayValue = resolvedValue ?? computedValue;
  const ink = contrastInk(displayValue ?? "#ffffff");
  const checkerboard = isTransparent(resolvedValue) || isTransparent(computedValue);

  return (
    <figure className="m-0 flex flex-col gap-3 min-w-40">
      <div
        ref={surfaceRef}
        aria-label={label}
        className="h-24 rounded-md border border-border"
        style={{
          backgroundColor: background,
          backgroundImage: checkerboard
            ? "linear-gradient(45deg, #d4d4d8 25%, transparent 25%, transparent 75%, #d4d4d8 75%), linear-gradient(45deg, #d4d4d8 25%, transparent 25%, transparent 75%, #d4d4d8 75%)"
            : undefined,
          backgroundSize: checkerboard ? "12px 12px" : undefined,
          backgroundPosition: checkerboard ? "0 0, 6px 6px" : undefined,
        }}
      >
        <span className="sr-only">{label}</span>
        {displayValue ? (
          <span className="inline-block m-2 text-xs font-mono" style={{ color: ink }}>
            {displayValue}
          </span>
        ) : null}
      </div>
      <TokenMeta
        items={[
          { label: "Token", value: path },
          { label: "CSS variable", value: cssVar },
          ...(displayValue ? [{ label: resolvedValue ? "Resolved value" : "Active value", value: displayValue }] : []),
          ...extraItems,
        ]}
      />
    </figure>
  );
}
