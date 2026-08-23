terraform {
  required_providers {
    nxos = {
      source  = "CiscoDevNet/nxos"
      version = "~> 0.14"
    }
  }
  required_version = ">= 1.3.0"
}

# ─── Provider ───────────────────────────────────────────────────────────────

provider "nxos" {
  username = var.nxos_username
  password = var.nxos_password
  url      = "https://${var.nxos_host}"
  insecure = var.insecure_tls
}

# ─── Platform Information ────────────────────────────────────────────────────

data "nxos_platform" "this" {}

# ─── Physical Interfaces ─────────────────────────────────────────────────────
# Returns all physical interfaces on the switch via the physical_interfaces list

data "nxos_physical_interface" "this" {}

# ─── VLANs / Bridge Domains ──────────────────────────────────────────────────

data "nxos_bridge_domain" "this" {}

# ─── VRFs ────────────────────────────────────────────────────────────────────

data "nxos_vrf" "this" {}

# ─── Routing Protocols ───────────────────────────────────────────────────────

data "nxos_bgp" "this" {}

data "nxos_ospf" "this" {}

data "nxos_isis" "this" {}

# ─── NTP ─────────────────────────────────────────────────────────────────────

data "nxos_ntp" "this" {}

# ─── SNMP ────────────────────────────────────────────────────────────────────

data "nxos_snmp" "this" {}

# ─── AAA / User Management ───────────────────────────────────────────────────

data "nxos_user_management" "this" {}

# ─── Spanning Tree ───────────────────────────────────────────────────────────

data "nxos_spanning_tree" "this" {}

# ─── Logging ─────────────────────────────────────────────────────────────────

data "nxos_logging" "this" {}


