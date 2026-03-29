/**
 * VLAN Uplink Configuration
 *
 * Define the exact MikroTik interface names for each VLAN you want to monitor.
 * The `name` is a human-readable label for the UI; `iface` is the exact
 * MikroTik interface name that gets passed to `/interface/monitor-traffic`
 * and `/interface/print stats`.
 *
 * To add or change VLANs, simply edit this array.
 */
export interface VlanEntry {
  /** Human-readable label shown in the UI (e.g. "IIG") */
  name: string
  /** Exact MikroTik interface name (e.g. "vlan10-iig") */
  ifacce: string
  /** Accent color for the chart (hex) */
  color: string
}

export const VLANS: VlanEntry[] = [
  { name: 'IIG',      ifacce: 'IIG',      color: '#6366f1' }, // Indigo
  { name: 'BDIX',     ifacce: 'BDIX',     color: '#10b981' }, // Emerald
  { name: 'YouTube',  ifacce: 'YouTube',  color: '#f59e0b' }, // Amber
  { name: 'Facebook', ifacce: 'FaceBook', color: '#3b82f6' }, // Blue (capital B!)
  { name: 'FTP',      ifacce: 'FTP',      color: '#ef4444' }, // Red
]

/** Convenience: just the interface name strings */
export const VLAN_INTERFACE_NAMES = VLANS.map(v => v.ifacce)
