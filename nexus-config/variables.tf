variable "nxos_host" {
  description = "IP address or FQDN of the Cisco Nexus switch (NX-API must be enabled)"
  type        = string
}

variable "nxos_username" {
  description = "Username for authenticating to the Nexus switch"
  type        = string
  default     = "admin"
}

variable "nxos_password" {
  description = "Password for authenticating to the Nexus switch"
  type        = string
  sensitive   = true
}

variable "insecure_tls" {
  description = "Skip TLS certificate verification (set true for self-signed certs in lab environments)"
  type        = bool
  default     = false
}
