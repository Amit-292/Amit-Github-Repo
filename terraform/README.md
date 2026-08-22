# Terraform - Azure Windows VM

This Terraform configuration provisions an Azure **Windows Server 2022** Virtual Machine with supporting infrastructure.

## Resources Created

| Resource | Name |
|---|---|
| Resource Group | `<prefix>-rg` |
| Virtual Network | `<prefix>-vnet` |
| Subnet | `<prefix>-subnet` |
| Public IP (Static) | `<prefix>-pip` |
| Network Security Group | `<prefix>-nsg` |
| Network Interface | `<prefix>-nic` |
| Windows VM (2022-Datacenter) | `<prefix>-vm` |

## Prerequisites

- [Terraform >= 1.3.0](https://developer.hashicorp.com/terraform/install)
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) and logged in (`az login`)

## Usage

```bash
# 1. Go to the terraform directory
cd terraform

# 2. Copy and edit the variables file
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values (especially admin_password and allowed_rdp_source)

# 3. Initialize Terraform
terraform init

# 4. Preview changes
terraform plan

# 5. Apply
terraform apply

# 6. Connect via RDP using the output public IP
terraform output public_ip_address
```

## Destroy

```bash
terraform destroy
```

## Security Notes

- **Restrict RDP access**: Set `allowed_rdp_source` to your specific IP (e.g., `1.2.3.4/32`)
- **Strong password**: Azure requires uppercase, lowercase, digit, and special character
- **Never commit** `terraform.tfvars` to source control — add it to `.gitignore`
