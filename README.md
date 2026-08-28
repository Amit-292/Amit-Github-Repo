# Eksperty – Training & Placement Website

A modern, responsive training and placement website built with pure HTML/CSS/JavaScript and deployed globally via **GitHub Pages** using **Terraform**.

🌍 **Live Site:** `https://<YOUR_GITHUB_USERNAME>.github.io/desktop-tutorial/`

---

## 📁 Project Structure

```
├── index.html          # Main website (Home, About, Courses, Placements, Contact)
├── styles.css          # All styles (dark theme, responsive)
├── script.js           # Interactivity (nav, animations, form)
└── terraform/
    ├── main.tf                    # GitHub Pages Terraform config
    ├── variables.tf               # Input variables
    └── terraform.tfvars.example   # Example vars (copy & fill in)
```

---

## 🚀 Deploy with Terraform

### Prerequisites
- [Terraform](https://developer.hashicorp.com/terraform/downloads) ≥ 1.3
- A GitHub Personal Access Token (PAT) with **repo** and **pages** scopes
  → Create one at: https://github.com/settings/tokens

### Steps

```bash
# 1. Go to terraform directory
cd terraform

# 2. Set your GitHub token (never hardcode it)
export TF_VAR_github_token=ghp_xxxxxxxxxxxxxxxxxxxx

# 3. Copy and fill in the vars file
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your GitHub username

# 4. Initialise Terraform
terraform init

# 5. Preview what will be created
terraform plan

# 6. Apply – enables GitHub Pages on your repo
terraform apply
```

After `apply`, Terraform prints your live URL:
```
pages_url = "https://<YOUR_USERNAME>.github.io/desktop-tutorial/"
```

---

## 💻 Run Locally

Just open `index.html` in your browser – no build step required!

---

## 🔧 Customise

| What to change | File |
|---|---|
| Website content / sections | `index.html` |
| Colours, fonts, layout | `styles.css` |
| Animations, form logic | `script.js` |
| GitHub Pages config | `terraform/main.tf` |

---

## 🔒 Security Notes

- Never commit `terraform.tfvars` (contains your token)
- `terraform.tfvars` is in `.gitignore`
- Token is passed via `TF_VAR_github_token` env variable

---

*Built with ❤️ using GitHub Copilot & Terraform*
