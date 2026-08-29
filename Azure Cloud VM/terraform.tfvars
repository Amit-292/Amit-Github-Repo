# Copy this file to terraform.tfvars and fill in your values
# DO NOT commit terraform.tfvars to source control (it contains secrets)

prefix              = "myapp"
resource_group_name = "myapp-rg"
location            = "West US 2"
vm_size             = "Standard_D2s_v7"
admin_username      = "azureadmin"
admin_password      = "YourStr0ng!Password"   # Change this!
allowed_rdp_source  = "23.97.62.148/32"       # Restrict to your IP

tags = {
  environment = "dev"
  project     = "desktop-tutorial"
}
