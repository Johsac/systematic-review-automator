# 📄 Systematic Review Automator Pro

**Speed up your Systematic Literature Reviews (SLR) with AI.**  
A specialized tool for researchers that automates metadata extraction from scientific papers directly into Google Sheets.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![Gemini AI](https://img.shields.io/badge/AI-Gemini%203%20Flash%20Preview-blueviolet)
![License](https://img.shields.io/badge/License-Apache%202.0-green)

---

## ✨ Overview
Doing a Systematic Review usually involves reading hundreds of PDFs and manually filling out tables. This tool does the heavy lifting for you:
1. **Scans** your local PDF folder.
2. **Analyzes** papers using **Gemini 3 Flash Preview** (high speed & large context).
3. **Extracts** specific data points based on *your* needs.
4. **Syncs** everything to a Google Sheet, preventing duplicates and allowing instant updates.

---

## 📂 Project Structure
```text
systematic-review-automator/
├── 📂 app/
│   ├── 📂 static/          # Frontend (HTML, CSS, Glassmorphism JS)
│   └── 📄 server.py        # Backend (Flask + Gemini AI + GSheets Logic)
├── 📂 pdfs/                # Put your scientific PDFs here
├── 📂 txts/                # Local cache of extracted text (automatic)
├── 📄 .env                 # API Keys & Sheet ID (Private)
├── 📄 credentials.json     # Google Cloud Service Account (Private)
├── 📄 requirements.txt     # Python dependencies
├── 📄 README.md            # You are here
├── 📄 LICENSE              # Apache 2.0 License
├── 📄 run_windows.bat      # Windows one-click launcher
└── 📄 run_linux.sh         # Linux/Mac launcher
```

---

## 🚀 Getting Started

### 1. Prerequisites (Setup)

#### A. Gemini API Key
1. Go to [**Google AI Studio**](https://aistudio.google.com/).
2. Click on **"Get API key"** and create a new one.
3. Save it for the `.env` configuration step.

#### B. Google Sheets & Cloud Credentials
This tool needs a "Service Account" to write to your Google Sheets:
1. Go to the [**Google Cloud Console**](https://console.cloud.google.com/).
2. **Create a Project** (name it "Review-Automator").
3. In the search bar, look for **"Google Sheets API"** and click **Enable**.
4. Go to **APIs & Services > Credentials**.
5. Click **Create Credentials > Service Account**.
6. After creating it, click on the **Service Account email** to open its settings.
7. Go to the **Keys** tab > **Add Key > Create new key** (Choose **JSON**).
8. **Rename** the downloaded file to `credentials.json` and move it to the root of this project.
9. **IMPORTANT**: Open your Google Sheet in the browser, click **Share**, and paste the **Service Account Email** (as Editor).

---

### 2. Installation
Clone the project and install dependencies:
```bash
pip install -r requirements.txt
```

### 3. Configuration
Create a file named `.env` in the root folder (same level as `README.md`):
```env
GEMINI_API_KEY=your_gemini_key_here
SPREADSHEET_ID=your_google_sheet_id_from_url
PORT=5005
```

---

## 🛠 Usage Guide

### Step 1: Add your Papers
Place all your academic `.pdf` files inside the `/pdfs` folder.

### Step 2: Run the App
- **Windows**: Double-click `run_windows.bat`.
- **Linux/Mac**: Run `bash run_linux.sh` in your terminal.

Open your browser at: [**http://localhost:5005**](http://localhost:5005)

### Step 3: Configure Fields (Custom SLR)
Click the ⚙️ **Configure Fields** button in the dashboard.
- You can add custom questions like: `Architecture`, `Dataset Used`, or `Key Results`.
- Gemini will dynamically adapt to these new fields during the next analysis.

---

## 🛡 Security & Privacy
- **Privacy**: Your PDFs stay local. Only the extracted text is processed by Gemini.
- **Credentials**: The `.env` and `credentials.json` are listed in `.gitignore`. **NEVER commit them to a public repo.**

---

## 🤝 Contribution & Support
If you have suggestions, find bugs, or need help with the setup, please contact:
- **Johsac**: johsacgomez16@gmail.com
- Or feel free to open a **Pull Request**.

---
*Created to empower researchers and automate the boring parts of science.*
