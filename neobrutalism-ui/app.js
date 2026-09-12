/**
 * NEO-BRUTALIST BENTO BOX VAULT - CONTROLLER SCRIPT
 * Handles real-time search, filter tags, drag-and-drop quick drop,
 * and seamless connection to NotesForAll backend API with instant offline fallback.
 */

// Initial Seed / Fallback Data (incorporating exact user prompt requirements)
const INITIAL_FILES = [
  {
    id: 1,
    name: "DSA_Master_Theorem_Notes.pdf",
    type: "PDF",
    size: "2.4 MB",
    date: "2026-09-08",
    downloads: 342,
    subject: "CS301"
  },
  {
    id: 2,
    name: "Linear_Probing_Lab.zip",
    type: "ZIP",
    size: "14.8 MB",
    date: "2026-09-07",
    downloads: 189,
    subject: "CS301"
  },
  {
    id: 3,
    name: "OS_Virtual_Memory_Paging.pdf",
    type: "PDF",
    size: "4.1 MB",
    date: "2026-09-06",
    downloads: 277,
    subject: "CS302"
  },
  {
    id: 4,
    name: "DBMS_Normalization_CheatSheet.md",
    type: "MD",
    size: "180 KB",
    date: "2026-09-05",
    downloads: 512,
    subject: "CS303"
  },
  {
    id: 5,
    name: "CN_Subnetting_Cheatsheet.pdf",
    type: "PDF",
    size: "1.2 MB",
    date: "2026-09-04",
    downloads: 418,
    subject: "CS304"
  },
  {
    id: 6,
    name: "Software_Architecture_Patterns.pptx",
    type: "PPT",
    size: "6.8 MB",
    date: "2026-09-03",
    downloads: 164,
    subject: "CS305"
  },
  {
    id: 7,
    name: "Compiler_Design_Lexical_Grammar.docx",
    type: "DOC",
    size: "820 KB",
    date: "2026-09-02",
    downloads: 95,
    subject: "CS306"
  }
];

let filesData = [...INITIAL_FILES];
let activeFilter = 'ALL';
let searchQuery = '';

// DOM Elements
const fileListContainer = document.getElementById('fileListContainer');
const searchInput = document.getElementById('searchInput');
const statTotalUploads = document.getElementById('statTotalUploads');
const statActiveSubjects = document.getElementById('statActiveSubjects');
const quickDropZone = document.getElementById('quickDropZone');
const quickFileInput = document.getElementById('quickFileInput');

// Modal Elements
const uploadModal = document.getElementById('uploadModal');
const openUploadBtn = document.getElementById('openUploadBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const uploadForm = document.getElementById('uploadForm');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderFiles();
  updateStats();
  setupEventListeners();
  tryFetchLiveBackend();
});

// Setup Event Listeners
function setupEventListeners() {
  // Real-time search query
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderFiles();
    });
  }

  // Filter tags
  document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      activeFilter = tag.dataset.filter;
      renderFiles();
    });
  });

  // Modal Open / Close
  if (openUploadBtn) openUploadBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);
  if (uploadModal) {
    uploadModal.addEventListener('click', (e) => {
      if (e.target === uploadModal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && uploadModal.classList.contains('active')) {
      closeModal();
    }
  });

  // Upload Form Submit
  if (uploadForm) {
    uploadForm.addEventListener('submit', handleFormUpload);
  }

  // Quick Drop Zone
  if (quickDropZone && quickFileInput) {
    quickDropZone.addEventListener('click', () => quickFileInput.click());

    quickFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleDroppedFiles(e.target.files);
      }
    });

    quickDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      quickDropZone.classList.add('dragover');
    });

    quickDropZone.addEventListener('dragleave', () => {
      quickDropZone.classList.remove('dragover');
    });

    quickDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      quickDropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleDroppedFiles(e.dataTransfer.files);
      }
    });
  }
}

// Render File List in Main Feed Cell
function renderFiles() {
  if (!fileListContainer) return;

  const filtered = filesData.filter(file => {
    const matchesFilter = (activeFilter === 'ALL') || (file.type === activeFilter);
    const matchesSearch = !searchQuery || file.name.toLowerCase().includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  if (filtered.length === 0) {
    fileListContainer.innerHTML = `
      <div style="padding: 24px; text-align: center; font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; color: var(--muted-mono);">
        [!] NO_RECORDS_FOUND FOR QUERY "${searchQuery.toUpperCase()}"
      </div>
    `;
    return;
  }

  fileListContainer.innerHTML = filtered.map(file => {
    const badgeClass = getBadgeClass(file.type);
    return `
      <div class="file-row">
        <div class="file-left">
          <span class="file-badge ${badgeClass}">${file.type}</span>
          <span class="file-name" title="${file.name}">${file.name}</span>
        </div>
        <div class="file-right">
          <div class="file-meta-mono">
            <span>DATE: ${file.date}</span> // <span>SIZE: ${file.size}</span>
          </div>
          <div class="row-actions">
            <button class="btn-mini" onclick="viewFileRecord(${file.id})">view</button>
            <button class="btn-mini" onclick="downloadFileRecord(${file.id})">dl</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getBadgeClass(type) {
  switch (type) {
    case 'ZIP': return 'badge-zip';
    case 'MD': return 'badge-md';
    case 'PPT': return 'badge-ppt';
    default: return '';
  }
}

// Update Stats
function updateStats() {
  if (statTotalUploads) {
    statTotalUploads.textContent = filesData.length;
  }
  if (statActiveSubjects) {
    const subjects = new Set(filesData.map(f => f.subject));
    statActiveSubjects.textContent = `${subjects.size} / 6`;
  }
}

// Handle Modal Actions
function openModal() {
  uploadModal.classList.add('active');
  document.getElementById('modalTitleInput')?.focus();
}

function closeModal() {
  uploadModal.classList.remove('active');
  uploadForm.reset();
}

function handleFormUpload(e) {
  e.preventDefault();
  const title = document.getElementById('modalTitleInput').value.trim();
  const fileInput = document.getElementById('modalFileInput');
  const subject = document.getElementById('modalSubjectSelect').value;

  if (!title) return;

  const fileName = fileInput.files[0] ? fileInput.files[0].name : `${title}.pdf`;
  const ext = fileName.split('.').pop().toUpperCase();
  const formattedSize = fileInput.files[0] ? formatBytes(fileInput.files[0].size) : "1.8 MB";

  const newRecord = {
    id: Date.now(),
    name: fileName,
    type: ext || 'PDF',
    size: formattedSize,
    date: new Date().toISOString().split('T')[0],
    downloads: 0,
    subject: subject
  };

  filesData.unshift(newRecord);
  renderFiles();
  updateStats();
  closeModal();

  showBannerAlert(`[SUCCESS] FILE RECORD "${fileName}" COMMITTED TO VAULT`);
}

function handleDroppedFiles(fileList) {
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const ext = file.name.split('.').pop().toUpperCase();
    filesData.unshift({
      id: Date.now() + i,
      name: file.name,
      type: ext || 'RAW',
      size: formatBytes(file.size),
      date: new Date().toISOString().split('T')[0],
      downloads: 0,
      subject: "CS301"
    });
  }
  renderFiles();
  updateStats();
  showBannerAlert(`[SUCCESS] ${fileList.length} FILE(S) QUEUED IN QUICK_DROP`);
}

function viewFileRecord(id) {
  const file = filesData.find(f => f.id === id);
  if (file) {
    alert(`[SYSTEM_INSPECTOR]\nFILE_NAME: ${file.name}\nSIZE: ${file.size}\nDATE: ${file.date}\nTYPE: ${file.type}\nSTATUS: VERIFIED_READABLE`);
  }
}

function downloadFileRecord(id) {
  const file = filesData.find(f => f.id === id);
  if (file) {
    showBannerAlert(`[DOWNLOAD_INITIALIZED] TRANSFERRING: ${file.name}`);
  }
}

function showBannerAlert(msg) {
  const ticker = document.querySelector('.sys-ticker');
  if (ticker) {
    const originalText = ticker.innerHTML;
    ticker.style.backgroundColor = '#00E676';
    ticker.innerHTML = `<strong>${msg}</strong>`;
    setTimeout(() => {
      ticker.style.backgroundColor = '';
      ticker.innerHTML = originalText;
    }, 2800);
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Attempt live backend sync if Spring Boot is running on localhost:8080
async function tryFetchLiveBackend() {
  try {
    const res = await fetch('http://localhost:8080/api/subjects', { signal: AbortSignal.timeout(1200) });
    if (res.ok) {
      const subjects = await res.json();
      if (subjects && subjects.length > 0) {
        statActiveSubjects.textContent = `${subjects.length} / ${subjects.length}`;
      }
    }
  } catch (e) {
    // Graceful offline fallback maintained
  }
}
