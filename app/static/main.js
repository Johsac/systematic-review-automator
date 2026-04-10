// Default dynamic fields
const DEFAULT_FIELDS = [
    { key: "title", label: "Title", description: "Scientific paper title" },
    { key: "year", label: "Year", description: "Publication year" },
    { key: "authors", label: "Authors", description: "List of authors and affiliations" },
    { key: "pages", label: "Pages", description: "Number of pages (excluding references)" },
    { key: "abstract", label: "Abstract", description: "Brief summary of the paper" },
    { key: "venue", label: "Venue", description: "Journal or Conference name" }
];

let extractionFields = JSON.parse(localStorage.getItem('extractionFields')) || [...DEFAULT_FIELDS];

document.addEventListener('DOMContentLoaded', () => {
    loadFiles();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('configBtn').addEventListener('click', openConfig);
    document.getElementById('closeConfigBtn').addEventListener('click', closeConfig);
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
    document.getElementById('addFieldBtn').addEventListener('click', addNewFieldRow);
    document.getElementById('uploadBtn').addEventListener('click', uploadToSheets);
}

async function loadFiles() {
    const list = document.getElementById('fileList');
    try {
        const res = await fetch('/api/files');
        const data = await res.json();
        
        list.innerHTML = "";
        if (data.files.length === 0) {
            list.innerHTML = '<p class="empty-msg">No PDFs found in /pdfs folder.</p>';
            return;
        }

        data.files.forEach(f => {
            const el = document.createElement('div');
            el.className = 'file-item';
            el.style.display = 'flex';
            el.style.justifyContent = 'space-between';
            el.style.alignItems = 'center';
            
            const badgeClass = f.is_processed ? 'success' : 'warning';
            const badgeText = f.is_processed ? 'In Sheets' : 'Pending';
            
            el.innerHTML = `
                <div>
                    <div class="file-name" style="margin-bottom:0.2rem;">${f.filename}</div>
                    <span class="badge ${badgeClass}">${badgeText}</span>
                </div>
                <button class="btn-primary" style="padding: 0.4rem 0.8rem; margin:0; width: auto; font-size: 0.8rem;">Analyze</button>
            `;
            
            el.querySelector('button').addEventListener('click', () => analyzeFile(f.filename));
            list.appendChild(el);
        });
    } catch (e) {
        list.innerHTML = '<p class="error-msg">Error loading files.</p>';
    }
}

async function analyzeFile(filename) {
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('dataForm').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('statusMsg').textContent = "";
    
    // Set PDF src to the iframe
    document.getElementById('pdfFrame').src = '/api/pdfs/' + encodeURIComponent(filename);
    
    try {
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ filename, fields: extractionFields })
        });
        const data = await res.json();
        
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('dataForm').classList.remove('hidden');

        if (data.status === 'success') {
            generateForm(data.extracted);
        } else {
            alert("Analysis failed or AI returned invalid data. Switched to manual entry.");
            generateForm({});
        }
    } catch (e) {
        document.getElementById('loading').classList.add('hidden');
        alert("Server error during analysis.");
    }
}

function generateForm(extractedData) {
    const container = document.getElementById('dynamicFields');
    container.innerHTML = "";

    extractionFields.forEach(field => {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = field.label;
        
        let input;
        if (field.key === 'abstract') {
            input = document.createElement('textarea');
            input.rows = 4;
        } else {
            input = document.createElement('input');
            input.type = 'text';
        }
        
        input.id = `input_${field.key}`;
        input.value = extractedData[field.key] || "";
        
        group.appendChild(label);
        group.appendChild(input);
        container.appendChild(group);
    });
}

async function uploadToSheets() {
    const statusMsg = document.getElementById('statusMsg');
    statusMsg.textContent = "Uploading...";
    statusMsg.className = "status-msg";

    const entry = {};
    extractionFields.forEach(field => {
        entry[field.key] = document.getElementById(`input_${field.key}`).value;
    });

    const body = {
        entry: entry,
        fields_order: extractionFields.map(f => f.key),
        fields_labels: extractionFields.reduce((acc, f) => { acc[f.key] = f.label; return acc; }, {})
    };

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });
        const data = await res.json();
        
        if (data.success) {
            statusMsg.textContent = data.action === 'updated' ? 'Successfully updated in Sheets!' : 'Successfully added to Sheets!';
            statusMsg.classList.add('success');
            loadFiles(); // Refresh In Sheets badges
        } else {
            statusMsg.textContent = "Upload failed: " + data.error;
            statusMsg.classList.add('error');
        }
    } catch (e) {
        statusMsg.textContent = "Connection error.";
        statusMsg.classList.add('error');
    }
}

// Configuration Logic
function openConfig() {
    const tbody = document.getElementById('fieldsListBody');
    tbody.innerHTML = "";
    
    // Disable save button to start with until changes happen
    const saveBtn = document.getElementById('saveConfigBtn');
    saveBtn.disabled = true;
    saveBtn.style.opacity = '0.5';
    saveBtn.style.cursor = 'not-allowed';
    
    extractionFields.forEach((field, index) => {
        const tr = createConfigRow(field, index);
        tbody.appendChild(tr);
    });
    
    document.getElementById('configModal').classList.remove('hidden');
}

function enableSave() {
    const saveBtn = document.getElementById('saveConfigBtn');
    saveBtn.disabled = false;
    saveBtn.style.opacity = '1';
    saveBtn.style.cursor = 'pointer';
}

function createConfigRow(field, index) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" oninput="enableSave()" value="${field.key}" class="config-key" ${index < 6 ? 'disabled' : ''}></td>
        <td><input type="text" oninput="enableSave()" value="${field.label}" class="config-label"></td>
        <td><input type="text" oninput="enableSave()" value="${field.description}" class="config-desc"></td>
        <td>${index >= 6 ? '<button class="btn-remove" onclick="removeFieldRow(this)">Delete</button>' : '<small>Locked</small>'}</td>
    `;
    return tr;
}

function addNewFieldRow() {
    const tbody = document.getElementById('fieldsListBody');
    const tr = createConfigRow({ key: "", label: "", description: "" }, 99);
    tbody.appendChild(tr);
    enableSave(); // Explicitly enable immediately upon adding a new row
}

function removeFieldRow(btn) {
    btn.closest('tr').remove();
    enableSave(); // Enabling upon deletion since it changes schema
}

function saveConfig() {
    const rows = document.querySelectorAll('#fieldsListBody tr');
    const newFields = [];
    
    rows.forEach(row => {
        const key = row.querySelector('.config-key').value.trim();
        const label = row.querySelector('.config-label').value.trim();
        const description = row.querySelector('.config-desc').value.trim();
        
        if (key && label) {
            newFields.push({ key, label, description });
        }
    });
    
    extractionFields = newFields;
    localStorage.setItem('extractionFields', JSON.stringify(extractionFields));
    closeConfig();
    
    // Si el formulario estaba visible, lo repintamos vacío para mostrar los nuevos campos físicos
    if (!document.getElementById('dataForm').classList.contains('hidden')) {
        generateForm({});
    }
    
    alert("Configuration saved. Click 'Analyze' on a PDF to extract these new fields.");
}

function closeConfig() {
    document.getElementById('configModal').classList.add('hidden');
}
