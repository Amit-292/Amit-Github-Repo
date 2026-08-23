# ─── Platform ────────────────────────────────────────────────────────────────

output "platform_info" {
  description = "Hardware platform details"
  value       = data.nxos_platform.this
}

# ─── Interfaces ──────────────────────────────────────────────────────────────

output "physical_interfaces" {
  description = "All physical interface configurations"
  value       = data.nxos_physical_interface.this.physical_interfaces
}

# ─── VLANs ───────────────────────────────────────────────────────────────────

output "bridge_domains" {
  description = "Bridge domain (VLAN) configuration"
  value       = data.nxos_bridge_domain.this
}

# ─── Routing ─────────────────────────────────────────────────────────────────

output "vrfs" {
  description = "VRF instances configured on the switch"
  value       = data.nxos_vrf.this
}

output "bgp_config" {
  description = "BGP process configuration"
  value       = data.nxos_bgp.this
}

output "ospf_config" {
  description = "OSPF process configuration"
  value       = data.nxos_ospf.this
}

output "isis_config" {
  description = "IS-IS process configuration"
  value       = data.nxos_isis.this
}

# ─── Services ────────────────────────────────────────────────────────────────

output "ntp_config" {
  description = "NTP configuration"
  value       = data.nxos_ntp.this
}

output "snmp_config" {
  description = "SNMP configuration"
  value       = data.nxos_snmp.this
}

output "aaa_config" {
  description = "AAA / user management configuration"
  value       = data.nxos_user_management.this
  sensitive   = true
}

output "stp_config" {
  description = "Spanning Tree Protocol configuration"
  value       = data.nxos_spanning_tree.this
}

output "logging_config" {
  description = "Logging configuration"
  value       = data.nxos_logging.this
}
