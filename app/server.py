import os
import re
import json
from dotenv import load_dotenv
import pandas as pd
import gspread
from google.oauth2.service_account import Credentials
import google.generativeai as genai
from flask import Flask, request, jsonify, send_from_directory
import fitz  # PyMuPDF for better double-column handling

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='static')
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDFS_DIR = os.path.join(BASE_DIR, 'pdfs')
TXTS_DIR = os.path.join(BASE_DIR, 'txts')
CREDENTIALS_PATH = os.path.join(BASE_DIR, 'credentials.json')

# Configuration from .env
SPREADSHEET_ID = os.getenv('SPREADSHEET_ID')
API_KEY = os.getenv('GEMINI_API_KEY')
PORT = int(os.getenv('PORT', 5005))

def extract_text_from_pdf(filepath):
    """Extracts text using PyMuPDF ensuring reading order for double-column layouts"""
    doc = fitz.open(filepath)
    text = ""
    pages = len(doc)
    
    for index, page in enumerate(doc):
        # sort=True extracts following visual reading order
        blocks = page.get_text("blocks", sort=True)
        page_text = "\n".join([block[4] for block in blocks])
        
        if page_text:
            # Simple heuristic to stop at references
            if 'References' in page_text and index > pages * 0.7:
                break
            if 'REFERENCES' in page_text and index > pages * 0.7:
                break
            text += page_text + "\n"
            
    doc.close()
    return text, pages

def get_processed_titles_from_sheets():
    scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    try:
        credentials = Credentials.from_service_account_file(CREDENTIALS_PATH, scopes=scopes)
        gc = gspread.authorize(credentials)
        sh = gc.open_by_key(SPREADSHEET_ID)
        worksheet = sh.get_worksheet(0)
        # title is usually in the first column
        titles = worksheet.col_values(1)
        return [t.strip().lower() for t in titles if t.strip()]
    except Exception as e:
        print(f"Error accessing Sheets: {e}")
        return []

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/pdfs/<path:filename>')
def serve_pdf(filename):
    return send_from_directory(PDFS_DIR, filename)

@app.route('/api/files', methods=['GET'])
def get_files():
    processed_titles = get_processed_titles_from_sheets()
    files = []
    
    if not os.path.exists(PDFS_DIR):
        os.makedirs(PDFS_DIR)
        
    for filename in os.listdir(PDFS_DIR):
        if filename.endswith(".pdf"):
            is_processed = False
            clean_filename = re.sub(r'[^a-z0-9]', '', filename.lower())
            
            for t in processed_titles:
                clean_title = re.sub(r'[^a-z0-9]', '', str(t).lower())
                if len(clean_title) >= 10:
                    if clean_title[:20] in clean_filename or clean_filename[:20] in clean_title:
                        is_processed = True
                        break

            files.append({
                "filename": filename,
                "is_processed": is_processed
            })
            
    return jsonify({"files": files})

@app.route('/api/analyze', methods=['POST'])
def analyze_pdf():
    data = request.json
    filename = data.get("filename")
    fields = data.get("fields", []) # List of {key: "...", label: "...", description: "..."}
    
    filepath = os.path.join(PDFS_DIR, filename)
    txt_filename = filename.replace('.pdf', '.txt')
    txt_filepath = os.path.join(TXTS_DIR, txt_filename)
    
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404
        
    try:
        if not os.path.exists(txt_filepath):
            text, raw_pages = extract_text_from_pdf(filepath)
            with open(txt_filepath, 'w', encoding='utf-8') as f:
                f.write(text)
        else:
            with open(txt_filepath, 'r', encoding='utf-8') as f:
                text = f.read()
    except Exception as e:
         return jsonify({"error": str(e)}), 500
         
    if API_KEY:
        try:
            genai.configure(api_key=API_KEY)
            model = genai.GenerativeModel("gemini-3-flash-preview")
            
            # Construct dynamic prompt
            schema_description = ""
            for field in fields:
                schema_description += f'"{field["key"]}": ({field["description"]}),\n'
            
            prompt = f"""
            Analyze this scientific paper and strictly return a flat JSON object with the following keys:
            {schema_description}

            Text: {text[:25000]}
            """
            
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                )
            )
            parsed_data = json.loads(response.text)
            
            return jsonify({
                "status": "success",
                "extracted": parsed_data,
                "text_snippet": text[:1000]
            })
            
        except Exception as e:
            print(f"============================\nGEMINI API ERROR: {e}\n============================")
            return jsonify({"status": "manual_fallback", "error": str(e), "text_raw": text})

    return jsonify({"status": "manual_fallback", "text_raw": text})

@app.route('/api/upload', methods=['POST'])
def upload_row():
    data = request.json
    fields_order = data.get("fields_order", []) # Order of keys for columns
    entry = data.get("entry", {})
    
    row = [entry.get(key, "") for key in fields_order]
    
    scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    try:
        credentials = Credentials.from_service_account_file(CREDENTIALS_PATH, scopes=scopes)
        gc = gspread.authorize(credentials)
        sh = gc.open_by_key(SPREADSHEET_ID)
        worksheet = sh.get_worksheet(0)
        
        all_values = worksheet.get_all_values()
        
        # 1. Update Headers explicitly on Row 1 to accommodate any newly added fields
        current_headers = [data.get("fields_labels", {}).get(key, key) for key in fields_order]
        col_letter_h = chr(ord('A') + len(fields_order) - 1)
        
        is_empty = True
        if len(all_values) > 0:
            for row_list in all_values:
                for cell in row_list:
                    if str(cell).strip() != "":
                        is_empty = False
                        break
                if not is_empty:
                    break
        
        if is_empty:
            worksheet.update(f'A1:{col_letter_h}1', [current_headers])
            all_values = [current_headers]
        else:
            worksheet.update(f'A1:{col_letter_h}1', [current_headers])
            all_values[0] = current_headers # Update local cache
            
        # 2. Duplicate detection (Title based - usually first column)
        title_to_insert = re.sub(r'[^a-z0-9]', '', str(entry.get("title", "")).lower())
        short_title = title_to_insert[:20]
        
        row_to_update = -1
        for i, r in enumerate(all_values):
            if len(r) > 0:
                existing_clean = re.sub(r'[^a-z0-9]', '', str(r[0]).lower())
                if len(existing_clean) >= 10 and len(short_title) >= 10:
                    if existing_clean[:20] in short_title or short_title in existing_clean[:20]:
                        row_to_update = i + 1
                        break
                    
        if row_to_update != -1:
            col_letter = chr(ord('A') + len(fields_order) - 1)
            cell_range = f'A{row_to_update}:{col_letter}{row_to_update}'
            worksheet.update(cell_range, [row])
            return jsonify({"success": True, "action": "updated"})
        else:
            empty_row_idx = len(all_values) + 1
            col_letter = chr(ord('A') + len(fields_order) - 1)
            cell_range = f'A{empty_row_idx}:{col_letter}{empty_row_idx}'
            worksheet.update(cell_range, [row])
            return jsonify({"success": True, "action": "appended"})
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    if not os.path.exists(PDFS_DIR): os.makedirs(PDFS_DIR)
    if not os.path.exists(TXTS_DIR): os.makedirs(TXTS_DIR)
    app.run(debug=True, port=PORT)
