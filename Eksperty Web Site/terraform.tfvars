# ============================================================
#  Eksperty – Terraform tfvars EXAMPLE
#  File: terraform/terraform.tfvars.example
#
#  Copy this to terraform.tfvars and fill in your values.
#  NEVER commit terraform.tfvars to version control.
# ============================================================

github_owner    = "Amit-292"
repository_name = "desktop-tutorial"
pages_branch    = "main"
pages_path      = "/"

# Set github_token via environment variable (recommended):
#   export TF_VAR_github_token=ghp_xxxxxxxxxxxxxxxxxxxx
#
# OR add it here (keep the file in .gitignore):
# github_token = "ghp_xxxxxxxxxxxxxxxxxxxx"
