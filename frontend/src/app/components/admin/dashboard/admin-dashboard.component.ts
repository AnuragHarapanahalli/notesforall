import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { Subject, FolderType, FOLDER_LABELS, FOLDER_ICONS } from '../../../models/subject.model';
import { FileEntry, getFileIcon, formatFileSize } from '../../../models/file-entry.model';

type Panel = 'subjects' | 'files' | 'submissions';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="dash-page">
      <div class="container">
        <!-- Top Title Bar -->
        <div class="dash-header">
          <div>
            <span class="label">CONSOLE</span>
            <h2>Admin Dashboard</h2>
          </div>
          <div class="header-actions">
            <a routerLink="/" class="btn btn-ghost">Preview Public Site</a>
            <button class="btn btn-ghost logout-action" (click)="logout()">Sign Out</button>
          </div>
        </div>

        <!-- Mode Switcher Tabs -->
        <div class="dash-tabs">
          <button
            class="dash-tab"
            [class.active]="panel === 'subjects'"
            (click)="panel = 'subjects'"
          >
            📂 Manage Subjects
          </button>
          <button
            class="dash-tab"
            [class.active]="panel === 'files'"
            (click)="panel = 'files'; loadSubjectsForFiles()"
          >
            📎 Upload & Manage Documents
          </button>
          <button
            class="dash-tab"
            [class.active]="panel === 'submissions'"
            (click)="panel = 'submissions'; loadSubmissions()"
          >
            📥 Student Submissions
            <span class="badge-pending" *ngIf="pendingCount > 0">{{ pendingCount }}</span>
          </button>
        </div>

        <!-- ══ PANEL: SUBJECTS ══ -->
        <div class="panel-section" *ngIf="panel === 'subjects'">
          <!-- Create Subject Window -->
          <div class="mac-window section-window">
            <div class="mac-window-bar">
              <div class="traffic-dots">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
              </div>
              <span class="window-title">new_subject.sh</span>
            </div>

            <div class="window-content">
              <h3>Create New Academic Subject</h3>
              <p class="window-sub">Adding a subject creates the 3 default folders (Notes, PYQs, PPTs). Folders remain hidden to students until files are added.</p>

              <div class="grid-2">
                <div class="form-group">
                  <label>Subject Name *</label>
                  <input
                    type="text"
                    class="form-input"
                    [(ngModel)]="newSubject.name"
                    placeholder="e.g. Operating Systems"
                  />
                </div>
                <div class="form-group">
                  <label>Code / Acronym *</label>
                  <input
                    type="text"
                    class="form-input"
                    [(ngModel)]="newSubject.code"
                    placeholder="e.g. OS or CS302"
                  />
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Description (Optional)</label>
                  <input
                    type="text"
                    class="form-input"
                    [(ngModel)]="newSubject.description"
                    placeholder="e.g. Concurrency, memory management, file systems..."
                  />
                </div>
                <div class="form-group">
                  <label>Subject Status</label>
                  <select class="form-input" [(ngModel)]="newSubject.isLive">
                    <option [ngValue]="true">🟢 Actively Maintained (Live)</option>
                    <option [ngValue]="false">🔴 Deprecated / Archived</option>
                  </select>
                </div>
              </div>

              <div class="action-footer">
                <span class="msg-success" *ngIf="createSuccess">✓ Subject created successfully!</span>
                <span class="msg-error" *ngIf="createError">{{ createError }}</span>
                <button
                  class="btn btn-accent"
                  (click)="createSubject()"
                  [disabled]="creating || !newSubject.name || !newSubject.code"
                >
                  {{ creating ? 'Creating...' : '+ Create Subject' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Subject List Window -->
          <div class="mac-window section-window">
            <div class="mac-window-bar">
              <div class="traffic-dots">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
              </div>
              <span class="window-title">all_subjects.json</span>
            </div>

            <div class="window-content">
              <div class="content-header">
                <h3>Existing Subjects ({{ subjects.length }})</h3>
              </div>

              <div class="status-box" *ngIf="subjectsLoading">
                <div class="spinner"></div>
              </div>

              <div class="empty-state" *ngIf="!subjectsLoading && subjects.length === 0">
                <p>No subjects in the system yet. Add one above.</p>
              </div>

              <div class="table-container" *ngIf="!subjectsLoading && subjects.length > 0">
                <table class="mac-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Active Folders</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let s of subjects">
                      <td>
                        <button
                          type="button"
                          class="status-pill status-toggle-btn"
                          [class.live]="isSubjectLive(s)"
                          [class.deprecated]="!isSubjectLive(s)"
                          (click)="toggleSubjectLive(s)"
                          [disabled]="togglingSubjectId === s.id"
                          [title]="'Status: ' + (isSubjectLive(s) ? 'LIVE' : 'DEPRECATED') + ' — Click to toggle'"
                        >
                          <span class="status-dot"></span>
                          <span>{{ togglingSubjectId === s.id ? 'Updating...' : (isSubjectLive(s) ? 'LIVE' : 'DEPRECATED') }}</span>
                          <span class="toggle-arrow" *ngIf="togglingSubjectId !== s.id">⇄</span>
                        </button>
                      </td>
                      <td><span class="code-pill">{{ s.code }}</span></td>
                      <td class="name-cell"><strong>{{ s.name }}</strong></td>
                      <td class="desc-cell">{{ s.description || '—' }}</td>
                      <td>
                        <span class="mini-pill" *ngIf="s.folders?.['NOTES']">📝 Notes</span>
                        <span class="mini-pill" *ngIf="s.folders?.['PYQS']">📋 PYQs</span>
                        <span class="mini-pill" *ngIf="s.folders?.['PPTS']">📊 PPTs</span>
                        <span class="dim" *ngIf="!s.folders?.['NOTES'] && !s.folders?.['PYQS'] && !s.folders?.['PPTS']">Empty</span>
                      </td>
                      <td>
                        <div class="row-actions">
                          <button
                            type="button"
                            class="btn-edit"
                            (click)="openEditModal(s)"
                            title="Edit details & status"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            class="btn-delete"
                            (click)="deleteSubject(s)"
                            [disabled]="deletingId === s.id"
                          >
                            {{ deletingId === s.id ? 'Deleting...' : '🗑 Delete' }}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ══ PANEL: FILES ══ -->
        <div class="panel-section" *ngIf="panel === 'files'">
          <!-- Upload Window -->
          <div class="mac-window section-window">
            <div class="mac-window-bar">
              <div class="traffic-dots">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
              </div>
              <span class="window-title">file_uploader.py</span>
            </div>

            <div class="window-content">
              <h3>Upload Academic Materials</h3>
              <p class="window-sub">PDFs, Markdown (.md), Word (.docx), and PowerPoint (.pptx) will open in the in-app viewer with Table of Contents navigation.</p>

              <div class="grid-2">
                <div class="form-group">
                  <label>Target Subject *</label>
                  <select class="form-input" [(ngModel)]="uploadSubjectId" (change)="onSubjectChange()">
                    <option value="">-- Choose Subject --</option>
                    <option *ngFor="let s of subjects" [value]="s.id">{{ s.code }} — {{ s.name }}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Target Folder *</label>
                  <select class="form-input" [(ngModel)]="uploadFolder">
                    <option value="NOTES">📝 Notes</option>
                    <option value="PYQS">📋 Past Year Questions (PYQs)</option>
                    <option value="PPTS">📊 Presentations (PPTs)</option>
                  </select>
                </div>
              </div>

              <!-- MacMD Drop Zone -->
              <div
                class="drop-zone"
                [class.drag-active]="isDragging"
                (dragover)="onDragOver($event)"
                (dragleave)="isDragging = false"
                (drop)="onDrop($event)"
                (click)="filePicker.click()"
              >
                <input #filePicker type="file" hidden (change)="onFileSelected($event)" accept=".pdf,.md,.docx,.doc,.pptx,.ppt,.txt" multiple />
                <div class="drop-icon">📂</div>
                <p class="drop-primary">Drag & drop files here, or <span class="accent-text">browse files</span></p>
                <p class="drop-hint">Supports PDF, Markdown (.md), Word (.docx), PPTX, Text up to 50MB</p>

                <!-- Selected Files List -->
                <div class="file-chips" *ngIf="selectedFiles.length" (click)="$event.stopPropagation()">
                  <div class="chip-item" *ngFor="let f of selectedFiles">
                    <span>{{ getIcon(f.name) }} {{ f.name }}</span>
                    <span class="chip-size">{{ getSize(f.size) }}</span>
                  </div>
                </div>
              </div>

              <!-- Progress bar -->
              <div class="progress-container" *ngIf="uploading">
                <div class="progress-bar">
                  <div class="progress-fill"></div>
                </div>
                <span class="progress-text">Uploading {{ uploadIndex + 1 }} of {{ selectedFiles.length }} files...</span>
              </div>

              <div class="action-footer">
                <span class="msg-success" *ngIf="uploadSuccess">✓ {{ uploadSuccess }}</span>
                <span class="msg-error" *ngIf="uploadError">{{ uploadError }}</span>
                <button
                  class="btn btn-accent"
                  (click)="uploadFiles()"
                  [disabled]="uploading || !selectedFiles.length || !uploadSubjectId"
                >
                  {{ uploading ? 'Uploading...' : '⬆ Upload ' + (selectedFiles.length ? selectedFiles.length + ' File(s)' : '') }}
                </button>
                <button
                  class="btn btn-ghost"
                  (click)="clearFiles()"
                  *ngIf="selectedFiles.length && !uploading"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>

          <!-- Existing files in selected subject -->
          <div class="mac-window section-window" *ngIf="uploadSubjectId">
            <div class="mac-window-bar">
              <div class="traffic-dots">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
              </div>
              <span class="window-title">subject_files.ls</span>
            </div>

            <div class="window-content">
              <h3>Files Currently in Subject</h3>

              <div class="folders-review-grid">
                <div class="folder-column" *ngFor="let folder of allFolders">
                  <div class="folder-col-header">
                    <span class="col-icon">{{ folderIcons[folder] }}</span>
                    <span class="col-name">{{ folderLabels[folder] }}</span>
                    <span class="col-count">({{ (folderFiles[folder] || []).length }})</span>
                  </div>

                  <div class="status-box mini" *ngIf="folderFilesLoading[folder]">
                    <div class="spinner mini"></div>
                  </div>

                  <div class="files-stack" *ngIf="!folderFilesLoading[folder]">
                    <div class="empty-col" *ngIf="(folderFiles[folder] ?? []).length === 0">
                      <span>No files</span>
                    </div>

                    <div class="file-item-card" *ngFor="let f of folderFiles[folder] ?? []">
                      <div class="item-left">
                        <span class="item-icon">{{ getIcon(f.originalFileName) }}</span>
                        <div class="item-meta">
                          <span class="item-name" [title]="f.originalFileName">{{ f.originalFileName }}</span>
                          <span class="item-size">{{ getSize(f.fileSize) }}</span>
                        </div>
                      </div>
                      <button
                        class="btn-trash"
                        (click)="deleteFile(f, folder)"
                        [disabled]="deletingFileId === f.id"
                        title="Delete file"
                      >
                        {{ deletingFileId === f.id ? '...' : '✕' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ══ PANEL: SUBMISSIONS ══ -->
        <div class="panel-section" *ngIf="panel === 'submissions'">
          <div class="mac-window section-window">
            <div class="mac-window-bar">
              <div class="traffic-dots">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
              </div>
              <span class="window-title">review_queue.inbox</span>
            </div>

            <div class="window-content">
              <div class="submissions-header">
                <div>
                  <h3>Student Contributions & Submissions</h3>
                  <p class="window-sub">Review materials submitted by students. Approving automatically publishes them directly to the selected subject folder.</p>
                </div>

                <!-- Status Filter Pills -->
                <div class="sub-filters">
                  <button
                    class="sub-filter-pill"
                    [class.active]="submissionFilter === 'ALL'"
                    (click)="setSubmissionFilter('ALL')"
                  >
                    All ({{ submissions.length }})
                  </button>
                  <button
                    class="sub-filter-pill"
                    [class.active]="submissionFilter === 'PENDING'"
                    (click)="setSubmissionFilter('PENDING')"
                  >
                    Pending ({{ pendingCount }})
                  </button>
                  <button
                    class="sub-filter-pill"
                    [class.active]="submissionFilter === 'APPROVED'"
                    (click)="setSubmissionFilter('APPROVED')"
                  >
                    Approved
                  </button>
                  <button
                    class="sub-filter-pill"
                    [class.active]="submissionFilter === 'REJECTED'"
                    (click)="setSubmissionFilter('REJECTED')"
                  >
                    Rejected
                  </button>
                </div>
              </div>

              <!-- Loading -->
              <div class="status-box" *ngIf="submissionsLoading">
                <div class="spinner"></div>
              </div>

              <!-- Empty state -->
              <div class="empty-state" *ngIf="!submissionsLoading && filteredSubmissions.length === 0">
                <p>📭 No submissions found in this category.</p>
              </div>

              <!-- Submissions Table/List -->
              <div class="submissions-list" *ngIf="!submissionsLoading && filteredSubmissions.length > 0">
                <div class="submission-card card" *ngFor="let s of filteredSubmissions">
                  <div class="sub-card-top">
                    <div class="sub-title-group">
                      <span class="sub-type-badge">{{ getFolderLabel(s.folderType) }}</span>
                      <h4 class="sub-title">{{ s.title }}</h4>
                      <span class="sub-subject-tag">{{ s.subjectName }} ({{ s.subjectCode }})</span>
                    </div>
                    <span
                      class="sub-status-pill"
                      [class.status-pending]="s.status === 'PENDING'"
                      [class.status-approved]="s.status === 'APPROVED'"
                      [class.status-rejected]="s.status === 'REJECTED'"
                    >
                      {{ s.status }}
                    </span>
                  </div>

                  <div class="sub-card-details">
                    <div class="detail-item">
                      <span class="detail-label">File:</span>
                      <span class="detail-val font-mono">{{ s.originalFileName }} ({{ getSize(s.fileSize) }})</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Contributor:</span>
                      <span class="detail-val">{{ s.contributorName }} {{ s.contributorEmail ? '• ' + s.contributorEmail : '' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Submitted:</span>
                      <span class="detail-val">{{ s.submittedAt | date:'medium' }}</span>
                    </div>
                    <div class="detail-item" *ngIf="s.reviewNotes">
                      <span class="detail-label">Review Note:</span>
                      <span class="detail-val">{{ s.reviewNotes }}</span>
                    </div>
                  </div>

                  <div class="sub-card-actions">
                    <a
                      [href]="api.getSubmissionPreviewUrl(s.id)"
                      target="_blank"
                      rel="noopener"
                      class="btn btn-ghost btn-sm"
                    >
                      👁 Preview File
                    </a>

                    <ng-container *ngIf="s.status === 'PENDING'">
                      <button
                        class="btn btn-accent btn-sm"
                        (click)="approveSubmission(s)"
                        [disabled]="processingSubId === s.id"
                      >
                        {{ processingSubId === s.id ? 'Publishing...' : '✓ Approve & Publish' }}
                      </button>
                      <button
                        class="btn btn-danger btn-sm"
                        (click)="rejectSubmission(s)"
                        [disabled]="processingSubId === s.id"
                      >
                        ✕ Reject
                      </button>
                    </ng-container>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Subject Modal Dialog -->
        <div class="modal-backdrop" *ngIf="editingSubject" (click)="closeEditModal()">
          <div class="mac-window modal-window" (click)="$event.stopPropagation()">
            <div class="mac-window-bar">
              <div class="traffic-dots">
                <span class="dot dot-red" (click)="closeEditModal()" title="Close"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
              </div>
              <span class="window-title">edit_subject_{{ editingSubject.code }}.sh</span>
              <button type="button" class="modal-close" (click)="closeEditModal()" title="Close">✕</button>
            </div>

            <div class="window-content">
              <h3>Edit Subject & Status</h3>
              <p class="window-sub">Update course name, code, description, and actively maintained lifecycle status.</p>

              <div class="grid-2">
                <div class="form-group">
                  <label>Subject Name *</label>
                  <input
                    type="text"
                    class="form-input"
                    [(ngModel)]="editForm.name"
                    placeholder="e.g. Operating Systems"
                  />
                </div>
                <div class="form-group">
                  <label>Code / Acronym *</label>
                  <input
                    type="text"
                    class="form-input"
                    [(ngModel)]="editForm.code"
                    placeholder="e.g. OS or CS302"
                  />
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    class="form-input"
                    [(ngModel)]="editForm.description"
                    placeholder="Course description"
                  />
                </div>
                <div class="form-group">
                  <label>Subject Status *</label>
                  <select class="form-input" [(ngModel)]="editForm.isLive">
                    <option [ngValue]="true">🟢 Actively Maintained (Live)</option>
                    <option [ngValue]="false">🔴 Deprecated / Archived</option>
                  </select>
                </div>
              </div>

              <div class="action-footer">
                <span class="msg-error" *ngIf="editError">{{ editError }}</span>
                <div class="modal-btn-group">
                  <button type="button" class="btn btn-ghost" (click)="closeEditModal()">Cancel</button>
                  <button
                    type="button"
                    class="btn btn-accent"
                    (click)="saveSubjectEdit()"
                    [disabled]="savingEdit || !editForm.name || !editForm.code"
                  >
                    {{ savingEdit ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dash-page {
      padding: clamp(20px, 4vw, 40px) 0 80px;
    }

    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: clamp(20px, 3vw, 32px);
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .logout-action {
      color: var(--red);
      border-color: rgba(248, 113, 113, 0.3);
    }

    .logout-action:hover {
      background: rgba(248, 113, 113, 0.1);
      border-color: var(--red);
      color: var(--red);
    }

    /* Neo-Brutalist Admin Dashboard Tabs */
    .dash-tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .dash-tab {
      background: var(--bg-card);
      border: 2px solid var(--border);
      box-shadow: 3px 3px 0 var(--border);
      padding: 10px 18px;
      color: var(--ink);
      font-family: var(--font-mono);
      font-size: 0.86rem;
      font-weight: 800;
      cursor: pointer;
      text-transform: lowercase;
      transition: all 0.08s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .dash-tab:hover {
      background: var(--yellow);
      color: #000000;
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 var(--border);
    }

    .dash-tab.active {
      background: var(--ink);
      color: var(--bg);
    }

    .badge-pending {
      background: var(--harsh-orange);
      color: #FFFFFF;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 900;
      padding: 2px 6px;
      border: 1px solid var(--border);
    }

    /* Windows */
    .section-window {
      margin-bottom: 30px;
    }

    .window-title {
      font-size: 0.76rem;
      font-family: var(--font-mono);
      color: var(--muted);
      margin-left: 8px;
    }

    .window-content {
      padding: clamp(20px, 3vw, 32px);
      background: var(--bg-card);
    }

    .window-content h3 {
      font-size: clamp(18px, 2.2vw, 22px);
      margin-bottom: 6px;
    }

    .window-sub {
      color: var(--muted);
      font-size: 0.86rem;
      margin-bottom: 24px;
      line-height: 1.5;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }

    .form-group label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--ink);
    }

    .form-input {
      padding: 10px 14px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--ink);
      font-family: var(--font-inter);
      font-size: 0.92rem;
      transition: all 0.2s var(--ease);
      width: 100%;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .action-footer {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 12px;
      flex-wrap: wrap;
    }

    .msg-success {
      color: var(--green);
      font-size: 0.88rem;
    }

    .msg-error {
      color: var(--red);
      font-size: 0.88rem;
    }

    /* Table */
    .table-container {
      overflow-x: auto;
      margin-top: 16px;
    }

    .mac-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }

    .mac-table th {
      text-align: left;
      padding: 10px 14px;
      color: var(--muted);
      border-bottom: 1px solid var(--border);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .mac-table td {
      padding: 14px;
      border-bottom: 1px solid var(--border);
      color: var(--text);
      vertical-align: middle;
    }

    .status-toggle-btn {
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;
    }

    .status-toggle-btn:hover {
      filter: brightness(1.25);
      transform: scale(1.04);
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: var(--font-mono);
    }

    .status-pill.live {
      color: var(--green);
      background: rgba(52, 211, 153, 0.1);
      border-color: rgba(52, 211, 153, 0.3);
    }

    .status-pill.deprecated {
      color: #f87171;
      background: rgba(248, 113, 113, 0.1);
      border-color: rgba(248, 113, 113, 0.3);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .status-pill.live .status-dot {
      box-shadow: 0 0 6px var(--green);
      animation: pulse-dot 2s infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }

    .code-pill {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--accent-bright);
      background: var(--accent-glow);
      border: 1px solid var(--border-hover);
      padding: 2px 8px;
      border-radius: 4px;
    }

    .mini-pill {
      font-size: 0.72rem;
      background: var(--bg-card-hover);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 2px 6px;
      margin-right: 4px;
      display: inline-block;
    }

    .dim {
      color: var(--muted);
      font-size: 0.78rem;
    }

    .desc-cell {
      max-width: 260px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--muted);
    }

    .btn-delete {
      background: transparent;
      border: 1px solid rgba(248, 113, 113, 0.3);
      color: var(--red);
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.78rem;
      transition: all 0.2s;
    }

    .btn-delete:hover {
      background: rgba(248, 113, 113, 0.15);
      border-color: var(--red);
    }

    .row-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-edit {
      background: var(--bg-card-hover);
      border: 1px solid var(--border-hover);
      color: var(--ink);
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-edit:hover {
      background: var(--accent-glow);
      border-color: var(--accent);
      color: var(--accent-bright);
    }

    .toggle-arrow {
      font-size: 0.7rem;
      opacity: 0.7;
      margin-left: 2px;
    }

    /* Modal Backdrop and Window */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-window {
      width: 100%;
      max-width: 580px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
      animation: popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--muted);
      cursor: pointer;
      font-size: 0.95rem;
      padding: 2px 6px;
      margin-left: auto;
    }

    .modal-close:hover {
      color: var(--ink);
    }

    .modal-btn-group {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-left: auto;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes popIn {
      from { opacity: 0; transform: scale(0.95) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Drop Zone */
    .drop-zone {
      border: 2px dashed var(--border);
      border-radius: var(--radius);
      background: var(--bg-elevated);
      padding: clamp(30px, 5vw, 48px) 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.25s var(--ease);
      margin: 16px 0 20px;
    }

    .drop-zone:hover,
    .drop-zone.drag-active {
      border-color: var(--accent);
      background: var(--accent-glow);
      box-shadow: 0 0 30px var(--accent-glow);
    }

    .drop-icon {
      font-size: 2.8rem;
      margin-bottom: 8px;
    }

    .drop-primary {
      color: var(--ink);
      font-size: 0.98rem;
      font-weight: 500;
    }

    .accent-text {
      color: var(--accent-bright);
      text-decoration: underline;
    }

    .drop-hint {
      color: var(--muted);
      font-size: 0.8rem;
      margin-top: 6px;
    }

    .file-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      margin-top: 16px;
    }

    .chip-item {
      background: var(--bg-card);
      border: 1px solid var(--border-hover);
      padding: 6px 12px;
      border-radius: var(--radius-pill);
      font-size: 0.82rem;
      color: var(--ink);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .chip-size {
      color: var(--muted);
      font-size: 0.74rem;
    }

    /* Progress bar */
    .progress-container {
      margin-bottom: 16px;
    }

    .progress-bar {
      height: 6px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent), #c084fc);
      animation: fill-anim 1.6s ease-in-out infinite;
    }

    @keyframes fill-anim {
      0% { width: 0%; }
      50% { width: 70%; }
      100% { width: 100%; }
    }

    .progress-text {
      font-size: 0.78rem;
      color: var(--muted);
    }

    /* Existing files 3-columns review */
    .folders-review-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .folder-column {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 16px;
      display: flex;
      flex-direction: column;
    }

    .folder-col-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--ink);
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }

    .col-count {
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 400;
    }

    .files-stack {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .empty-col {
      color: var(--muted);
      font-size: 0.8rem;
      padding: 12px 0;
      text-align: center;
    }

    .file-item-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      padding: 8px 10px;
      border-radius: 6px;
    }

    .item-left {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;
    }

    .item-meta {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .item-name {
      font-size: 0.82rem;
      color: var(--ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-size {
      font-size: 0.72rem;
      color: var(--muted);
    }

    .btn-trash {
      background: none;
      border: none;
      color: var(--muted);
      cursor: pointer;
      font-size: 0.9rem;
      padding: 4px;
      transition: color 0.2s;
    }

    .btn-trash:hover {
      color: var(--red);
    }

    .status-box {
      text-align: center;
      padding: 30px;
      color: var(--muted);
    }

    .spinner {
      width: 28px;
      height: 28px;
      border: 2px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }

    .badge-pending {
      background: var(--accent);
      color: #ffffff;
      font-size: 0.72rem;
      padding: 1px 7px;
      border-radius: var(--radius-pill);
      margin-left: 6px;
      font-weight: 700;
    }

    .submissions-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .sub-filters {
      display: flex;
      gap: 6px;
      background: var(--bg);
      border: 1px solid var(--border);
      padding: 3px;
      border-radius: var(--radius-pill);
    }

    .sub-filter-pill {
      background: transparent;
      border: none;
      padding: 4px 12px;
      border-radius: var(--radius-pill);
      font-size: 0.8rem;
      color: var(--muted);
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .sub-filter-pill.active {
      background: var(--bg-card);
      color: var(--ink);
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .submissions-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .submission-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.2s;
    }

    .submission-card:hover {
      border-color: var(--border-hover);
    }

    .sub-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
    }

    .sub-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .sub-type-badge {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 600;
      background: var(--accent-glow);
      color: var(--accent-bright);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid var(--border-hover);
    }

    .sub-title {
      font-size: 1rem;
      color: var(--ink);
      font-weight: 600;
      margin: 0;
    }

    .sub-subject-tag {
      font-size: 0.8rem;
      color: var(--muted);
      background: var(--bg);
      border: 1px solid var(--border);
      padding: 2px 8px;
      border-radius: 4px;
    }

    .sub-status-pill {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: var(--radius-pill);
      letter-spacing: 0.04em;
    }

    .status-pending {
      background: rgba(234, 179, 8, 0.15);
      color: #eab308;
      border: 1px solid rgba(234, 179, 8, 0.3);
    }

    .status-approved {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .status-rejected {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .sub-card-details {
      display: flex;
      flex-wrap: wrap;
      gap: 16px 24px;
      font-size: 0.82rem;
      padding: 10px 14px;
      background: var(--bg);
      border-radius: 6px;
    }

    .detail-item {
      display: flex;
      gap: 6px;
    }

    .detail-label {
      color: var(--muted);
      font-weight: 500;
    }

    .detail-val {
      color: var(--text);
    }

    .sub-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      align-items: center;
      padding-top: 6px;
    }

    .btn-sm {
      padding: 5px 12px;
      font-size: 0.8rem;
    }

    .btn-danger {
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-danger:hover {
      background: #ef4444;
      color: #ffffff;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  panel: Panel = 'subjects';
  subjects: Subject[] = [];
  subjectsLoading = false;
  creating = false;
  deletingId: number | null = null;
  createSuccess = false;
  createError = '';

  newSubject: Partial<Subject> = { name: '', code: '', description: '', isLive: true };
  togglingSubjectId: number | null = null;

  // Edit Subject Modal state
  editingSubject: Subject | null = null;
  editForm = { name: '', code: '', description: '', isLive: true };
  savingEdit = false;
  editError = '';

  // Files panel
  uploadSubjectId: number | '' = '';
  uploadFolder: FolderType = 'NOTES';
  selectedFiles: File[] = [];
  uploading = false;
  uploadIndex = 0;
  uploadSuccess = '';
  uploadError = '';
  isDragging = false;
  deletingFileId: number | null = null;

  allFolders: FolderType[] = ['NOTES', 'PYQS', 'PPTS'];
  folderFiles: Record<string, FileEntry[]> = {};
  folderFilesLoading: Record<string, boolean> = {};
  folderLabels = FOLDER_LABELS;
  folderIcons = FOLDER_ICONS;

  getIcon = getFileIcon;
  getSize = formatFileSize;

  // Submissions panel
  submissions: any[] = [];
  submissionsLoading = false;
  submissionFilter: string = 'ALL';
  pendingCount = 0;
  processingSubId: number | null = null;

  constructor(public api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadSubjects();
    this.loadPendingCount();
  }

  get filteredSubmissions(): any[] {
    if (this.submissionFilter === 'ALL') return this.submissions;
    return this.submissions.filter(s => s.status === this.submissionFilter);
  }

  loadPendingCount(): void {
    this.api.getPendingSubmissionsCount().subscribe({
      next: (res) => { this.pendingCount = res.count; },
      error: () => {}
    });
  }

  loadSubmissions(): void {
    this.submissionsLoading = true;
    this.api.getAdminSubmissions().subscribe({
      next: (data) => {
        this.submissions = data;
        this.submissionsLoading = false;
        this.pendingCount = data.filter(s => s.status === 'PENDING').length;
      },
      error: () => {
        this.submissionsLoading = false;
      }
    });
  }

  setSubmissionFilter(f: string): void {
    this.submissionFilter = f;
  }

  approveSubmission(sub: any): void {
    this.processingSubId = sub.id;
    this.api.approveSubmission(sub.id).subscribe({
      next: (updated) => {
        sub.status = updated.status;
        sub.reviewNotes = updated.reviewNotes;
        this.processingSubId = null;
        this.loadPendingCount();
      },
      error: (err) => {
        this.processingSubId = null;
        alert(err?.error?.message || 'Failed to approve submission.');
      }
    });
  }

  rejectSubmission(sub: any): void {
    const reason = prompt('Enter a reason or feedback for rejection (optional):', 'File format or quality issues');
    if (reason === null) return;

    this.processingSubId = sub.id;
    this.api.rejectSubmission(sub.id, reason).subscribe({
      next: (updated) => {
        sub.status = updated.status;
        sub.reviewNotes = updated.reviewNotes;
        this.processingSubId = null;
        this.loadPendingCount();
      },
      error: (err) => {
        this.processingSubId = null;
        alert(err?.error?.message || 'Failed to reject submission.');
      }
    });
  }

  getFolderLabel(folder: any): string {
    const f = folder as FolderType;
    return this.folderLabels[f] || String(folder);
  }

  isSubjectLive(s: Subject): boolean {
    if (s.isLive !== undefined && s.isLive !== null) return s.isLive;
    if (s.live !== undefined && s.live !== null) return s.live;
    return true;
  }

  loadSubjects(): void {
    this.subjectsLoading = true;
    this.api.getSubjects().subscribe({
      next: (s) => {
        this.subjects = s;
        this.subjectsLoading = false;
      },
      error: () => {
        this.subjectsLoading = false;
      }
    });
  }

  loadSubjectsForFiles(): void {
    this.loadSubjects();
  }

  createSubject(): void {
    if (!this.newSubject.name || !this.newSubject.code) {
      this.createError = 'Subject Name and Code are required.';
      return;
    }
    this.creating = true;
    this.createError = '';
    this.createSuccess = false;
    this.api.createSubject(this.newSubject).subscribe({
      next: () => {
        this.creating = false;
        this.createSuccess = true;
        this.newSubject = { name: '', code: '', description: '', isLive: true };
        this.loadSubjects();
        setTimeout(() => (this.createSuccess = false), 3500);
      },
      error: () => {
        this.creating = false;
        this.createError = 'Failed to create subject.';
      }
    });
  }

  toggleSubjectLive(s: Subject): void {
    const current = this.isSubjectLive(s);
    const target = !current;
    this.togglingSubjectId = s.id;

    this.api.updateSubjectStatus(s.id, target).subscribe({
      next: (res) => {
        const nextVal = res.isLive !== undefined ? res.isLive : (res.live !== undefined ? res.live : target);
        s.isLive = nextVal;
        s.live = nextVal;
        this.togglingSubjectId = null;
      },
      error: () => {
        // Fallback: send full updateSubject
        this.api.updateSubject(s.id, {
          name: s.name,
          code: s.code,
          description: s.description,
          isLive: target
        }).subscribe({
          next: () => {
            s.isLive = target;
            s.live = target;
            this.togglingSubjectId = null;
          },
          error: () => {
            this.togglingSubjectId = null;
            alert('Failed to change subject status. Please verify the backend is reachable.');
          }
        });
      }
    });
  }

  openEditModal(s: Subject): void {
    this.editingSubject = s;
    this.editForm = {
      name: s.name,
      code: s.code,
      description: s.description || '',
      isLive: this.isSubjectLive(s)
    };
    this.editError = '';
  }

  closeEditModal(): void {
    this.editingSubject = null;
    this.editError = '';
  }

  saveSubjectEdit(): void {
    if (!this.editingSubject) return;
    if (!this.editForm.name || !this.editForm.code) {
      this.editError = 'Subject Name and Code are required.';
      return;
    }
    this.savingEdit = true;
    this.editError = '';

    const id = this.editingSubject.id;
    const targetLive = this.editForm.isLive;

    this.api.updateSubject(id, {
      name: this.editForm.name,
      code: this.editForm.code,
      description: this.editForm.description,
      isLive: targetLive
    }).subscribe({
      next: (res) => {
        this.savingEdit = false;
        if (this.editingSubject) {
          this.editingSubject.name = this.editForm.name;
          this.editingSubject.code = this.editForm.code;
          this.editingSubject.description = this.editForm.description;
          this.editingSubject.isLive = targetLive;
          this.editingSubject.live = targetLive;
        }
        this.closeEditModal();
        this.loadSubjects();
      },
      error: () => {
        this.savingEdit = false;
        this.editError = 'Failed to update subject.';
      }
    });
  }

  deleteSubject(s: Subject): void {
    if (!confirm(`Are you sure you want to delete "${s.name}"? All associated files will also be permanently deleted.`)) return;
    this.deletingId = s.id;
    this.api.deleteSubject(s.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.loadSubjects();
      },
      error: () => {
        this.deletingId = null;
      }
    });
  }

  onSubjectChange(): void {
    if (!this.uploadSubjectId) return;
    const id = Number(this.uploadSubjectId);
    this.allFolders.forEach(folder => {
      this.folderFilesLoading[folder] = true;
      this.api.getFiles(id, folder).subscribe({
        next: (files) => {
          this.folderFiles[folder] = files;
          this.folderFilesLoading[folder] = false;
        },
        error: () => {
          this.folderFiles[folder] = [];
          this.folderFilesLoading[folder] = false;
        }
      });
    });
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging = true;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging = false;
    const files = Array.from(e.dataTransfer?.files ?? []);
    this.selectedFiles = [...this.selectedFiles, ...files];
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.selectedFiles = [...this.selectedFiles, ...files];
  }

  clearFiles(): void {
    this.selectedFiles = [];
  }

  uploadFiles(): void {
    if (!this.uploadSubjectId || !this.selectedFiles.length) return;
    this.uploading = true;
    this.uploadSuccess = '';
    this.uploadError = '';
    this.uploadIndex = 0;

    const subjectId = Number(this.uploadSubjectId);
    const uploadNext = (index: number) => {
      if (index >= this.selectedFiles.length) {
        this.uploading = false;
        this.uploadSuccess = `${this.selectedFiles.length} file(s) uploaded successfully!`;
        this.selectedFiles = [];
        this.onSubjectChange();
        return;
      }
      this.uploadIndex = index;
      this.api.uploadFile(subjectId, this.uploadFolder, this.selectedFiles[index]).subscribe({
        next: () => uploadNext(index + 1),
        error: () => {
          this.uploading = false;
          this.uploadError = `Failed to upload "${this.selectedFiles[index].name}".`;
        }
      });
    };
    uploadNext(0);
  }

  deleteFile(f: FileEntry, folder: FolderType): void {
    if (!confirm(`Delete "${f.originalFileName}"?`)) return;
    this.deletingFileId = f.id;
    this.api.deleteFile(f.id).subscribe({
      next: () => {
        this.deletingFileId = null;
        this.folderFiles[folder] = (this.folderFiles[folder] ?? []).filter(x => x.id !== f.id);
      },
      error: () => {
        this.deletingFileId = null;
      }
    });
  }

  logout(): void {
    this.auth.logout();
  }
}