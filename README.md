# Eksperty – Training & Placement Website & RestroIQ

A modern, responsive training and placement website built with pure HTML/CSS/JavaScript and deployed globally via **GitHub Pages** using **Terraform**.

Also includes **RestroIQ** - The Intelligence Behind Your Restaurant, a complete cloud-based billing and restaurant management solution.

🌍 **Live Site:** `https://<YOUR_GITHUB_USERNAME>.github.io/desktop-tutorial/`
🍽️ **RestroIQ App:** `https://restaurant-billing-production-a629.up.railway.app`

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

## 🍽️ RestroIQ - Restaurant Management Solution

**RestroIQ: The Intelligence Behind Your Restaurant**

A complete cloud-based billing and restaurant management platform designed for Indian restaurants.

### Key Features
- **Smart QR Menu:** Customers scan QR code → browse menu → order from their phone
- **Real-Time Kitchen Display System (KDS):** Orders appear instantly, track preparation status
- **Automatic Billing:** GST-compliant invoices generated in seconds
- **UPI Payments:** Dynamic QR codes for Google Pay, PhonePe, Paytam, BHIM
- **Admin Dashboard:** Analytics, bill history, best sellers, customer feedback
- **Group Billing:** Split bills for groups (up to 8 separate orders per table)
- **WhatsApp Integration:** Share bills and bills via WhatsApp with PDF downloads
- **Feedback System:** 5-star ratings, customer insights, export reports

### Live Demo
- **Admin Panel:** https://restaurant-billing-production-a629.up.railway.app/admin
- **Kitchen Display:** https://restaurant-billing-production-a629.up.railway.app/kitchen
- **Customer Menu:** https://restaurant-billing-production-a629.up.railway.app/table/1/1
- **Marketing Brochure:** `restaurant-billing/MARKETING_BROCHURE.html` (10-page professional sales document with screenshots)

### Pricing
- **Starter Plan:** ₹1,000/month (10 tables, basic features)
- **Professional Plan:** ₹1,500/month (50 tables, advanced analytics)
- **Business Plan:** ₹3,000/month (unlimited tables, white-label options)

**Contact:** hr@eksperty.com | WhatsApp: +91 6302672256 | Website: eksperty.com

---



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
