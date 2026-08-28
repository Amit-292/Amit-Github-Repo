# ============================================================
#  Eksperty – Terraform Variables
#  File: terraform/variables.tf
# ============================================================

variable "github_token" {
  description = "GitHub Personal Access Token with repo + pages scopes"
  type        = string
  sensitive   = true
  # Set via: export TF_VAR_github_token=<your-token>
  # OR create a terraform.tfvars file (never commit it!)
}

variable "github_owner" {
  description = "Your GitHub username or organisation name"
  type        = string
  # e.g. "eksperty-org"
}

variable "repository_name" {
  description = "Name of the GitHub repository to publish as Pages"
  type        = string
  default     = "desktop-tutorial"
}

variable "pages_branch" {
  description = "Branch to serve GitHub Pages from"
  type        = string
  default     = "main"
}

variable "pages_path" {
  description = "Directory to serve (/ or /docs)"
  type        = string
  default     = "/"

  validation {
    condition     = contains(["/", "/docs"], var.pages_path)
    error_message = "pages_path must be '/' or '/docs'."
  }
}
