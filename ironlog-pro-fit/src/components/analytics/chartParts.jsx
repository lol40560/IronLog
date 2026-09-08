import React from "react";

const TOOLTIP_STYLE = {
  background: "#171717",
  border: "1px solid #262626",
  borderRadius: 12,
  fontSize: 12,
  padding: "8px 10px",
  color: "#fafafa",
};

export function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ margin: 0, color: "#a3a3a3", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ margin: "2px 0 0", fontWeight: 600 }}>
          {p.value.toLocaleString()}{unit}
        </p>
      ))}
    </div>
  );
}

export const axisProps = {
  stroke: "#525252",
  fontSize: 10,
  tickLine: false,
  axisLine: { stroke: "#262626" },
};