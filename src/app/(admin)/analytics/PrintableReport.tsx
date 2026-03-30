import { forwardRef } from "react"

interface PrintableReportProps {
  data: any
  forecast: any
}

/**
 * PrintableReport — A4-optimized, black-on-white executive summary.
 * 
 * This component is rendered off-screen and triggered via react-to-print.
 * All dark mode, glowing effects, and interactive elements are stripped.
 */
const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  function PrintableReport({ data, forecast }, ref) {
    if (!data) return null

    const { financials, profitability, leakage, staffPerformance, bandwidth, efficiency, growth } = data
    const now = new Date()
    const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    const generatedOn = now.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    const latestGrowth = growth?.[growth.length - 1]

    // Revenue per Mbps
    const revenuePerMbps = efficiency?.peakIIG > 0
      ? (financials?.gross || 0) / (efficiency.peakIIG * 1000)
      : 0

    return (
      <div
        ref={ref}
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "18mm 16mm",
          fontFamily: "'Segoe UI', 'Inter', Arial, sans-serif",
          color: "#111",
          backgroundColor: "#fff",
          fontSize: "11px",
          lineHeight: 1.6,
          boxSizing: "border-box",
        }}
      >
        {/* ── PDF Header ─────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "2px solid #111",
            paddingBottom: "10px",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "-0.5px",
              }}
            >
              Purrfect Universe
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 600, color: "#444" }}>
              Executive Summary
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{monthYear}</p>
            <p style={{ margin: "2px 0 0", fontSize: "9px", color: "#888" }}>
              Generated: {generatedOn}
            </p>
          </div>
        </div>

        {/* ── Section 1: Financials ───────────────────────── */}
        <SectionTitle title="1. Financial Performance" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <MetricBox
            label="Total Gross Revenue"
            value={`৳${(financials?.gross || 0).toLocaleString()}`}
          />
          <MetricBox
            label="Total Discounts (Leakage)"
            value={`৳${(leakage?.totalDiscounted || 0).toLocaleString()}`}
            sublabel={`${(leakage?.leakagePercentage || 0).toFixed(1)}% of gross`}
            alert={leakage?.isAlert}
          />
          <MetricBox
            label="Net Expected Profit"
            value={`৳${(profitability?.netProfit || 0).toLocaleString()}`}
            sublabel={`After ৳${(profitability?.staticExpense || 0).toLocaleString()} expenses`}
            isNegative={(profitability?.netProfit || 0) < 0}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <MetricBox
            label="Collection Efficiency"
            value={`${profitability?.collectionEfficiency || 0}%`}
            sublabel={`Collected ৳${(profitability?.totalCollected || 0).toLocaleString()} of ৳${(profitability?.totalBilled || 0).toLocaleString()} billed`}
          />
          <MetricBox
            label="Outstanding Balance"
            value={`৳${(profitability?.outstanding || 0).toLocaleString()}`}
          />
          <MetricBox
            label="Profit Margin"
            value={`${profitability?.profitMargin || 0}%`}
          />
        </div>

        {/* ── Section 2: Subscriber Base ──────────────────── */}
        <SectionTitle title="2. Subscriber Base" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <MetricBox
            label="Total Active Users"
            value={String(forecast?.totalActiveUsers || 0)}
          />
          <MetricBox
            label="New Acquisitions"
            value={String(latestGrowth?.newJoins || forecast?.newJoins || 0)}
          />
          <MetricBox
            label="Total Churn"
            value={String(latestGrowth?.churn || forecast?.churn || 0)}
          />
          <MetricBox
            label="Net Growth"
            value={`${(forecast?.netGrowth || 0) >= 0 ? "+" : ""}${forecast?.netGrowth || 0}`}
            isNegative={(forecast?.netGrowth || 0) < 0}
          />
        </div>

        {/* ── Section 3: Network Telemetry ────────────────── */}
        <SectionTitle title="3. Network Telemetry" />
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "10px",
            fontSize: "10.5px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1.5px solid #333" }}>
              <th style={thStyle}>VLAN</th>
              <th style={{ ...thStyle, textAlign: "right" }}>This Month (TB)</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Last Month (TB)</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Change</th>
            </tr>
          </thead>
          <tbody>
            {bandwidth && Object.entries(bandwidth).map(([name, stats]: [string, any]) => {
              const change = stats.lastMonthTB > 0
                ? (((stats.thisMonthTB - stats.lastMonthTB) / stats.lastMonthTB) * 100).toFixed(1)
                : "N/A"
              return (
                <tr key={name} style={{ borderBottom: "1px solid #e5e5e5" }}>
                  <td style={tdStyle}>{name}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>{stats.thisMonthTB}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>{stats.lastMonthTB}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>
                    {change === "N/A" ? "—" : `${Number(change) >= 0 ? "+" : ""}${change}%`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <MetricBox
            label="Revenue per Peak Gbps"
            value={`৳${(efficiency?.revenuePerGbps || 0).toLocaleString()}`}
            sublabel={`Peak IIG: ${efficiency?.peakIIG || 0} Gbps`}
          />
          <MetricBox
            label="Revenue per Peak Mbps"
            value={`৳${revenuePerMbps.toFixed(2)}`}
            sublabel={`Peak IIG: ${((efficiency?.peakIIG || 0) * 1000).toFixed(0)} Mbps`}
          />
        </div>

        {/* ── Section 4: Field Operations ─────────────────── */}
        <SectionTitle title="4. Field Operations — Staff Collection" />
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "10px",
            fontSize: "10.5px",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1.5px solid #333" }}>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Collector</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Target (৳)</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Collected (৳)</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Completion</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Avg Days</th>
            </tr>
          </thead>
          <tbody>
            {(staffPerformance || []).map((s: any, idx: number) => (
              <tr key={s.name} style={{ borderBottom: "1px solid #e5e5e5" }}>
                <td style={tdStyle}>{idx + 1}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{s.name}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>
                  {s.assignedTarget.toLocaleString()}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>
                  {s.collected.toLocaleString()}
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                  {s.progress.toFixed(0)}%
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontFamily: "monospace" }}>
                  {s.avgDaysToCollect} days
                </td>
              </tr>
            ))}
            {(staffPerformance || []).length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#999" }}>
                  No staff data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ── Footer ──────────────────────────────────────── */}
        <div
          style={{
            marginTop: "30px",
            paddingTop: "10px",
            borderTop: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "8px",
            color: "#aaa",
          }}
        >
          <span>Purrfect Universe — Confidential</span>
          <span>Generated by Purrfect Portal Analytics Engine</span>
        </div>
      </div>
    )
  }
)

export default PrintableReport

// ── Helper Sub-Components (inline, no external deps) ───────────

function SectionTitle({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontSize: "13px",
        fontWeight: 700,
        margin: "0 0 10px",
        paddingBottom: "4px",
        borderBottom: "1px solid #ccc",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        color: "#222",
      }}
    >
      {title}
    </h2>
  )
}

function MetricBox({
  label,
  value,
  sublabel,
  alert,
  isNegative,
}: {
  label: string
  value: string
  sublabel?: string
  alert?: boolean
  isNegative?: boolean
}) {
  return (
    <div
      style={{
        border: `1px solid ${alert ? "#f97316" : "#ddd"}`,
        borderRadius: "6px",
        padding: "10px 12px",
        backgroundColor: alert ? "#fff7ed" : "#fafafa",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "9px",
          fontWeight: 600,
          color: "#888",
          textTransform: "uppercase",
          letterSpacing: "0.4px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "4px 0 0",
          fontSize: "16px",
          fontWeight: 800,
          fontFamily: "monospace",
          color: isNegative ? "#dc2626" : "#111",
        }}
      >
        {value}
      </p>
      {sublabel && (
        <p style={{ margin: "2px 0 0", fontSize: "8px", color: alert ? "#f97316" : "#aaa" }}>
          {sublabel}
        </p>
      )}
    </div>
  )
}

// ── Table styles ────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "6px 8px",
  fontSize: "9px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.4px",
  color: "#555",
}

const tdStyle: React.CSSProperties = {
  padding: "6px 8px",
  verticalAlign: "middle",
}
