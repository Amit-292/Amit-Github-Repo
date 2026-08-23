output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.rg.name
}

output "vm_name" {
  description = "Name of the virtual machine"
  value       = azurerm_windows_virtual_machine.vm.name
}

output "public_ip_address" {
  description = "Public IP address of the VM (use for RDP)"
  value       = azurerm_public_ip.pip.ip_address
}

output "vm_id" {
  description = "Resource ID of the virtual machine"
  value       = azurerm_windows_virtual_machine.vm.id
}

output "admin_username" {
  description = "Administrator username"
  value       = azurerm_windows_virtual_machine.vm.admin_username
}
