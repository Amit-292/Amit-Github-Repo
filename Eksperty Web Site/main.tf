# ============================================================
#  Eksperty – GitHub Pages Deployment via Terraform
#  File: terraform/main.tf
# ============================================================

terraform {
  required_version = ">= 1.3.0"

  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

# ---------------------------------------------------------------
# Provider – authenticate via GITHUB_TOKEN environment variable
# ---------------------------------------------------------------
provider "github" {
  token = var.github_token
  owner = var.github_owner
}

# ---------------------------------------------------------------
# Data source – look up the existing repository
# ---------------------------------------------------------------
data "github_repository" "site" {
  name = var.repository_name
}

# ---------------------------------------------------------------
# Enable GitHub Pages on the repository
# ---------------------------------------------------------------
resource "github_repository_pages" "site" {
  repository = data.github_repository.site.name

  source {
    branch = var.pages_branch
    path   = var.pages_path     # "/" (root) or "/docs"
  }

  depends_on = [data.github_repository.site]
}

# ---------------------------------------------------------------
# (Optional) Set repository metadata / visibility
# ---------------------------------------------------------------
resource "github_repository" "site" {
  name        = var.repository_name
  description = "Eksperty – Training & Placement website hosted on GitHub Pages"
  visibility  = "public"          # must be public for free GitHub Pages

  # Preserve all existing content – don't auto-init
  auto_init            = false
  has_issues           = true
  has_wiki             = false
  has_projects         = false
  vulnerability_alerts = true

  # Prevent Terraform from destroying the repo accidentally
  lifecycle {
    prevent_destroy = true
    ignore_changes  = [auto_init]
  }
}

# ---------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------
output "pages_url" {
  description = "Live GitHub Pages URL for the Eksperty website"
  value       = "https://${var.github_owner}.github.io/${var.repository_name}/"
}

output "repo_html_url" {
  description = "GitHub repository URL"
  value       = data.github_repository.site.html_url
}

output "pages_custom_domain" {
  description = "Custom domain (if configured)"
  value       = try(github_repository_pages.site.custom_404, "none")
}
