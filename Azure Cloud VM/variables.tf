variable "prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "myapp"
}

variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "myapp-rg"
}

variable "location" {
  description = "Azure region to deploy resources"
  type        = string
  default     = "East US"
}

variable "vm_size" {
  description = "Size of the Azure Virtual Machine"
  type        = string
  default     = "Standard_B2s"
}

variable "admin_username" {
  description = "Administrator username for the VM"
  type        = string
  default     = "azureadmin"
}

variable "admin_password" {
  description = "Administrator password for the VM (must meet Azure complexity requirements)"
  type        = string
  sensitive   = true
}

variable "allowed_rdp_source" {
  description = "Source IP or CIDR allowed to RDP/WinRM into the VM. Use '*' to allow all (not recommended for production)."
  type        = string
  default     = "*"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    environment = "dev"
    project     = "desktop-tutorial"
  }
}
