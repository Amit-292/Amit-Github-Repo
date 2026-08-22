# Cisco Nexus – Retrieve Device Config with Terraform

This folder uses the **[CiscoDevNet/nxos](https://registry.terraform.io/providers/CiscoDevNet/nxos/latest/docs)** Terraform provider to read configuration from a Cisco Nexus switch over NX-API (HTTPS/REST).

## What is retrieved

| Section | Terraform data source |
|---|---|
| System info & hostname | `nxos_rest` (dn: `sys`) |
| Firmware / NX-OS version | `nxos_rest` (dn: `sys/ver`) |
| All interfaces (container) | `nxos_rest` (dn: `sys/intf`) |
| Named physical interfaces | `nxos_physical_interface` |
| VLANs / Bridge domains | `nxos_rest` (dn: `sys/bd`) |
| VRFs | `nxos_rest` (dn: `sys/inst`) |
| BGP configuration | `nxos_rest` (dn: `sys/bgp`) |
| OSPF configuration | `nxos_rest` (dn: `sys/ospf`) |
| NTP | `nxos_rest` (dn: `sys/time`) |
| SNMP | `nxos_rest` (dn: `sys/snmp`) |
| AAA | `nxos_rest` (dn: `sys/aaa`) |
| Spanning Tree | `nxos_rest` (dn: `sys/stp`) |

## Prerequisites

1. **NX-API must be enabled** on the switch:
   ```
   feature nxapi
   nxapi https port 443
   ```
2. Terraform ≥ 1.3.0 installed.

## Quick start

```bash
# 1. Copy and edit the variables file
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your switch IP and credentials

# 2. Initialise (downloads the nxos provider)
terraform init

# 3. Preview what will be read
terraform plan

# 4. Retrieve the configuration
terraform apply

# 5. View a specific output
terraform output -json queried_interfaces
terraform output -json system_info
```

## Security notes

- `terraform.tfvars` is listed in `.gitignore` — **never commit it**.
- For production use store the password in a secrets manager (e.g. HashiCorp Vault, Azure Key Vault) and pass it via an environment variable:
  ```bash
  export TF_VAR_nxos_password="$(az keyvault secret show --name nexus-pw --vault-name myvault --query value -o tsv)"
  ```
- Set `insecure_tls = false` when using a properly signed certificate.
