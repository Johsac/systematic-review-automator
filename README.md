# 📄 Systematic Review Automator Pro

**Speed up your Systematic Literature Reviews (SLR) with AI.**  
A specialized tool for researchers that automates metadata extraction from scientific papers directly into Google Sheets.

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![Gemini AI](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-blueviolet)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Overview
Doing a Systematic Review usually involves reading hundreds of PDFs and manually filling out tables. This tool does the heavy lifting for you:
1. **Scans** your local PDF folder.
2. **Analyzes** papers using **Gemini 1.5 Flash** (high speed & context).
3. **Extracts** specific data points based on *your* needs.
4. **Syncs** everything to a Google Sheet, preventing duplicates.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+**
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/) (It's free!).
- A **Google Cloud Project** with the Google Sheets API enabled.
  - Download your `credentials.json` (Service Account key).
  - Share your Target Google Sheet with the Service Account email (as **Editor**).

### 2. Installation
Clone the project and install dependencies:
```bash
pip install -r requirements.txt
```

### 3. Configuration
Create a file named `.env` in the root folder with the following content:
```env
GEMINI_API_KEY=your_gemini_key_here
SPREADSHEET_ID=your_google_sheet_id_here
PORT=5005
```

---

## 🛠 Usage Guide

### Step 1: Add your Papers
Place all your `.pdf` files inside the `/pdfs` folder.

### Step 2: Run the App
- **Windows**: Double-click `run_windows.bat`.
- **Linux/Mac**: Run `bash run_linux.sh` in your terminal.

Open your browser at: [**http://localhost:5005**](http://localhost:5005)

### Step 3: Customize your Analysis (Crucial!)
Click the ⚙️ **Configure Fields** button to define exactly what you want the AI to look for.
- **Example**: Add a field called `Methodology` with description `What research method was used? (Quantitative/Qualitative)`.
- The AI will automatically adapt its extraction prompt to find this specific info.

### Step 4: Analyze & Upload
1. Select a file from the list.
2. Review the PDF in the built-in viewer.
3. Click **Analyze** and check the results.
4. Click **Upload to Google Sheets** to save your data permanently.

---

## 🛡 Security & Privacy
- **Privacy**: Your PDFs stay local. Only the extracted text is sent to Gemini for analysis.
- **Credentials**: The `.env` and `credentials.json` files are listed in `.gitignore`. **NEVER** commit them to a public repository.

## 🤝 Contribution
Found a bug or have a suggestion? Feel free to open an issue or submit a pull request!

---
*Created to empower researchers and automate the boring parts of science.*
