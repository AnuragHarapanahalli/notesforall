import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Subject, FolderType } from '../../../models/subject.model';

@Component({
  selector: 'app-contribute-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="onBackdropClick($event)">
      <div class="popup-card" (click)="$event.stopPropagation()">
        <!-- Card Header with Icon, Title & Close Button -->
        <div class="card-header">
          <div class="header-content">
            <div class="header-icon-badge">
              <span>📤</span>
            </div>
            <div class="header-text">
              <h3 class="card-title">Contribute Study Material</h3>
              <p class="card-subtitle">Share lecture notes, PYQs, or presentations with your classmates.</p>
            </div>
          </div>
          <button
            type="button"
            class="card-close-btn"
            (click)="close()"
            title="Close dialog (Esc)"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <!-- Scrollable Card Body -->
        <div class="card-body">
          <!-- Success State -->
          <div class="alert-success-card" *ngIf="submittedSuccess">
            <div class="success-badge">🎉</div>
            <h4>Thank You for Contributing!</h4>
            <p>Your document has been submitted for admin review. Once approved, it will be published live in the subject repository.</p>
            <button type="button" class="btn-primary-pill" (click)="resetAndClose()">
              Done
            </button>
          </div>

          <!-- Contribution Form -->
          <form *ngIf="!submittedSuccess" (ngSubmit)="onSubmit()" #form="ngForm">
            <!-- Target Subject Selector -->
            <div class="form-group">
              <label for="subjectSelect" class="form-label">
                Target Subject <span class="req-star">*</span>
              </label>
              <div class="select-wrapper">
                <select
                  id="subjectSelect"
                  class="form-input custom-select"
                  name="subjectId"
                  [(ngModel)]="selectedSubjectId"
                  required
                >
                  <option [ngValue]="null" disabled>Select a subject...</option>
                  <option *ngFor="let s of subjects" [ngValue]="s.id">
                    {{ s.name }} ({{ s.code }})
                  </option>
                </select>
                <span class="select-arrow">▼</span>
              </div>
            </div>

            <!-- Material Category Pills -->
            <div class="form-group">
              <label class="form-label">
                Material Category <span class="req-star">*</span>
              </label>
              <div class="category-pills">
                <button
                  type="button"
                  class="pill-btn"
                  [class.active]="selectedFolder === 'NOTES'"
                  (click)="selectedFolder = 'NOTES'"
                >
                  <span class="pill-icon">📝</span> Notes
                </button>
                <button
                  type="button"
                  class="pill-btn"
                  [class.active]="selectedFolder === 'PYQS'"
                  (click)="selectedFolder = 'PYQS'"
                >
                  <span class="pill-icon">📑</span> PYQs
                </button>
                <button
                  type="button"
                  class="pill-btn"
                  [class.active]="selectedFolder === 'PPTS'"
                  (click)="selectedFolder = 'PPTS'"
                >
                  <span class="pill-icon">📊</span> PPTs
                </button>
              </div>
            </div>

            <!-- Document Title or Topic -->
            <div class="form-group">
              <label for="docTitle" class="form-label">Document Title or Topic (Optional)</label>
              <input
                id="docTitle"
                type="text"
                class="form-input"
                name="title"
                [(ngModel)]="title"
                placeholder="e.g. Unit 3 Concurrency Notes or 2023 End-Sem PYQ"
              />
            </div>

            <!-- Contributor Name & Email -->
            <div class="grid-2">
              <div class="form-group">
                <label for="contributorName" class="form-label">Your Name (Optional)</label>
                <input
                  id="contributorName"
                  type="text"
                  class="form-input"
                  name="contributorName"
                  [(ngModel)]="contributorName"
                  placeholder="e.g. Alex"
                />
              </div>
              <div class="form-group">
                <label for="contributorEmail" class="form-label">Email (Optional, for credit)</label>
                <input
                  id="contributorEmail"
                  type="email"
                  class="form-input"
                  name="contributorEmail"
                  [(ngModel)]="contributorEmail"
                  placeholder="alex@college.edu"
                />
              </div>
            </div>

            <!-- File Upload Dropzone -->
            <div class="form-group">
              <label class="form-label">
                Select Document File <span class="req-star">*</span>
              </label>
              <div
                class="file-dropzone"
                [class.has-file]="selectedFile !== null"
                [class.is-dragging]="isDragging"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)"
                (click)="fileInput.click()"
              >
                <input
                  #fileInput
                  type="file"
                  hidden
                  (change)="onFileSelected($event)"
                  accept=".pdf,.pptx,.ppt,.docx,.doc,.md,.markdown,.txt"
                />
                
                <div *ngIf="!selectedFile" class="dropzone-empty">
                  <div class="upload-icon-circle">
                    <span>📁</span>
                  </div>
                  <p class="dropzone-title">Click to browse or drag & drop file here</p>
                  <p class="dropzone-sub">Supports PDF, PPTX, DOCX, Markdown, and Text (up to 50MB)</p>
                </div>

                <div *ngIf="selectedFile" class="dropzone-selected">
                  <div class="file-icon-circle">
                    <span>📄</span>
                  </div>
                  <div class="file-details">
                    <span class="file-name" [title]="selectedFile.name">{{ selectedFile.name }}</span>
                    <span class="file-size-badge">{{ formatSize(selectedFile.size) }}</span>
                  </div>
                  <button
                    type="button"
                    class="change-file-btn"
                    (click)="$event.stopPropagation(); fileInput.click()"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>

            <!-- Error Banner -->
            <div class="form-error-banner" *ngIf="errorMessage">
              <span>⚠️</span>
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Card Actions -->
            <div class="card-actions">
              <button
                type="button"
                class="btn-ghost-pill"
                (click)="close()"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn-primary-pill"
                [disabled]="submitting || !selectedSubjectId || !selectedFile"
              >
                <span *ngIf="!submitting" class="submit-content">
                  <span>📤</span> Submit Material
                </span>
                <span *ngIf="submitting" class="submit-content">
                  <span class="mini-spinner"></span> Submitting...
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: clamp(14px, 3vw, 28px);
      pointer-events: auto;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Neo-Brutalist Popup Card Container */
    .popup-card {
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-card);
      border: 4px solid var(--border);
      box-shadow: 8px 8px 0 var(--border);
      overflow: hidden;
      pointer-events: auto;
      animation: cardPopIn 0.15s ease-out;
      position: relative;
    }

    @keyframes cardPopIn {
      from {
        transform: translateY(10px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    /* Card Header */
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 22px;
      border-bottom: 3px solid var(--border);
      background: var(--yellow);
      gap: 16px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon-badge {
      width: 38px;
      height: 38px;
      background: #000000;
      color: var(--yellow);
      border: 2px solid #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .card-title {
      font-size: 1.2rem;
      font-weight: 900;
      color: #000000;
      letter-spacing: -0.02em;
      margin: 0;
      line-height: 1.2;
      font-family: var(--font-mono);
      text-transform: lowercase;
    }

    .card-subtitle {
      font-size: 0.78rem;
      color: #333333;
      margin: 2px 0 0 0;
      line-height: 1.3;
      font-family: var(--font-mono);
    }

    .card-close-btn {
      width: 34px;
      height: 34px;
      background: #FFFFFF;
      border: 2px solid #000000;
      box-shadow: 2px 2px 0 #000000;
      color: #000000;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      font-weight: 900;
      flex-shrink: 0;
      padding: 0;
    }

    .card-close-btn:hover {
      background: var(--red);
      color: #FFFFFF;
    }

    .card-close-btn:active {
      transform: translate(1px, 1px);
      box-shadow: 1px 1px 0 #000000;
    }

    /* Card Body */
    .card-body {
      padding: 24px 28px;
      overflow-y: auto;
      flex: 1;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--ink);
      margin-bottom: 8px;
      letter-spacing: 0.02em;
      font-family: var(--font-mono);
    }

    .req-star {
      color: var(--harsh-orange);
    }

    .form-input {
      width: 100%;
      background: var(--input-bg);
      border: 2px solid var(--border);
      box-shadow: 3px 3px 0 var(--border);
      padding: 12px 14px;
      font-size: 0.9rem;
      font-family: var(--font-mono);
      font-weight: 700;
      color: var(--ink);
      outline: none;
      box-sizing: border-box;
    }

    .form-input:focus {
      background: var(--bg-card-hover);
      border-color: var(--border);
      box-shadow: 4px 4px 0 var(--blue-header);
    }

    .select-wrapper {
      position: relative;
    }

    .custom-select {
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
      padding-right: 36px;
    }

    .select-arrow {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.65rem;
      color: var(--ink);
      pointer-events: none;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 520px) {
      .grid-2 {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }

    /* Category Pills */
    .category-pills {
      display: flex;
      gap: 10px;
    }

    .pill-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 14px;
      background: var(--bg-card);
      border: 2px solid var(--border);
      box-shadow: 3px 3px 0 var(--border);
      color: var(--ink);
      font-family: var(--font-mono);
      font-size: 0.84rem;
      font-weight: 800;
      cursor: pointer;
      outline: none;
      transition: all 0.08s ease;
    }

    .pill-icon {
      font-size: 0.95rem;
    }

    .pill-btn:hover {
      background: var(--yellow);
      color: #000000;
    }

    .pill-btn.active {
      background: var(--ink);
      color: var(--bg);
    }

    /* File Dropzone Card */
    .file-dropzone {
      background: var(--bg-card);
      border: 3px dashed var(--border);
      padding: 24px 20px;
      text-align: center;
      cursor: pointer;
      outline: none;
      transition: all 0.1s ease;
    }

    .file-dropzone:hover {
      background: var(--bg-card-hover);
      border-color: var(--border);
    }

    .file-dropzone.is-dragging {
      background: var(--yellow);
      border-style: solid;
      color: #000000;
    }

    .file-dropzone.has-file {
      border-style: solid;
      background: var(--bg-card-hover);
      padding: 18px 22px;
    }

    .upload-icon-circle {
      width: 46px;
      height: 46px;
      background: var(--ink);
      color: var(--yellow);
      border: 2px solid var(--border);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      margin-bottom: 10px;
    }

    .dropzone-title {
      font-family: var(--font-mono);
      font-size: 0.88rem;
      color: var(--ink);
      font-weight: 800;
      margin: 0 0 6px 0;
    }

    .dropzone-sub {
      font-family: var(--font-mono);
      font-size: 0.74rem;
      color: var(--muted);
      font-weight: 700;
      margin: 0;
    }

    .dropzone-selected {
      display: flex;
      align-items: center;
      gap: 14px;
      text-align: left;
    }

    .file-icon-circle {
      width: 42px;
      height: 42px;
      background: var(--ink);
      color: var(--bg);
      border: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .file-details {
      flex: 1;
      min-width: 0;
    }

    .file-name {
      display: block;
      font-family: var(--font-mono);
      font-size: 0.88rem;
      font-weight: 800;
      color: var(--ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size-badge {
      display: inline-block;
      font-size: 0.74rem;
      color: #000000;
      font-weight: 800;
      font-family: var(--font-mono);
      background: var(--yellow);
      border: 1px solid var(--border);
      padding: 1px 8px;
      margin-top: 4px;
    }

    .change-file-btn {
      background: var(--bg-card);
      border: 2px solid var(--border);
      box-shadow: 2px 2px 0 var(--border);
      padding: 6px 12px;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--ink);
      cursor: pointer;
      flex-shrink: 0;
    }

    .change-file-btn:hover {
      background: var(--yellow);
      color: #000000;
    }

    /* Error Banner */
    .form-error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #FFF0F0;
      border: 2px solid var(--red);
      padding: 10px 14px;
      color: var(--red);
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 800;
      margin-top: 16px;
    }

    /* Card Actions */
    .card-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 14px;
      margin-top: 24px;
      padding-top: 18px;
      border-top: 2px solid var(--border);
    }

    .btn-ghost-pill {
      background: var(--bg-card);
      border: 2px solid var(--border);
      box-shadow: 3px 3px 0 var(--border);
      padding: 10px 20px;
      font-family: var(--font-mono);
      font-size: 0.86rem;
      font-weight: 900;
      color: var(--ink);
      cursor: pointer;
      text-transform: lowercase;
    }

    .btn-ghost-pill:hover {
      background: var(--bg-card-hover);
    }

    .btn-ghost-pill:active {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 var(--border);
    }

    .btn-primary-pill {
      background: var(--harsh-orange);
      border: 2px solid var(--border);
      box-shadow: 4px 4px 0 var(--border);
      padding: 10px 24px;
      font-family: var(--font-mono);
      font-size: 0.86rem;
      font-weight: 900;
      color: #FFFFFF;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-transform: lowercase;
    }

    .btn-primary-pill:hover:not(:disabled) {
      background: #E65100;
    }

    .btn-primary-pill:active:not(:disabled) {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 var(--border);
    }

    .btn-primary-pill:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    .submit-content {
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }

    .mini-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Success Card */
    .alert-success-card {
      text-align: center;
      padding: 36px 20px;
      border-radius: 20px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
    }

    .success-badge {
      font-size: 2.8rem;
      margin-bottom: 12px;
    }

    .alert-success-card h4 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ink);
      margin: 0 0 10px 0;
    }

    .alert-success-card p {
      font-size: 0.86rem;
      color: var(--muted);
      line-height: 1.55;
      margin: 0 auto 24px auto;
      max-width: 420px;
    }
  `]
})
export class ContributeModalComponent implements OnInit {
  @Input() preselectedSubjectId: number | null = null;
  @Input() preselectedFolder: FolderType = 'NOTES';
  @Output() modalClosed = new EventEmitter<void>();

  subjects: Subject[] = [];
  selectedSubjectId: number | null = null;
  selectedFolder: FolderType = 'NOTES';
  title = '';
  contributorName = '';
  contributorEmail = '';
  selectedFile: File | null = null;

  submitting = false;
  submittedSuccess = false;
  errorMessage = '';
  isDragging = false;

  constructor(private api: ApiService) {}

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.close();
  }

  ngOnInit(): void {
    if (this.preselectedSubjectId) {
      this.selectedSubjectId = this.preselectedSubjectId;
    }
    if (this.preselectedFolder) {
      this.selectedFolder = this.preselectedFolder;
    }

    this.api.getSubjects().subscribe({
      next: (subs) => {
        this.subjects = subs.filter(s => s.isLive ?? s.live ?? true);
        if (!this.selectedSubjectId && this.subjects.length > 0) {
          this.selectedSubjectId = this.subjects[0].id;
        }
      },
      error: () => {}
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    this.selectedFile = file;
    if (!this.title) {
      // Default title to filename without extension
      this.title = file.name.replace(/\.[^/.]+$/, '');
    }
  }

  onSubmit(): void {
    if (!this.selectedSubjectId || !this.selectedFile) {
      this.errorMessage = 'Please select a subject and choose a document file.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('subjectId', String(this.selectedSubjectId));
    formData.append('folderType', this.selectedFolder);
    if (this.title) formData.append('title', this.title);
    if (this.contributorName) formData.append('contributorName', this.contributorName);
    if (this.contributorEmail) formData.append('contributorEmail', this.contributorEmail);
    formData.append('file', this.selectedFile);

    this.api.submitMaterial(formData).subscribe({
      next: () => {
        this.submitting = false;
        this.submittedSuccess = true;
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err?.error?.message || 'Failed to submit material. Please try again.';
      }
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  close(): void {
    this.modalClosed.emit();
  }

  resetAndClose(): void {
    this.submittedSuccess = false;
    this.selectedFile = null;
    this.title = '';
    this.contributorName = '';
    this.contributorEmail = '';
    this.modalClosed.emit();
  }
}
