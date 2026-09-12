import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Subject } from '../../models/subject.model';
import { ContributeModalComponent } from '../shared/contribute-modal/contribute-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ContributeModalComponent],
  template: `
    <div class="container home-container">

      <!-- ====================================================================
           SEARCH QUERY SECTION (Clean & Prominent)
           ==================================================================== -->
      <section class="search-section">
        <div class="search-box-cell">
          <span class="search-prefix">QUERY:</span>
          <input
            type="text"
            placeholder="search courseware by name, code (e.g. CS301, DBMS, OS, Mathematics)..."
            class="search-input"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearch()"
            autofocus
          />
          <button class="clear-btn" *ngIf="searchQuery" (click)="searchQuery = ''; onSearch()">
            [ CLEAR ]
          </button>
        </div>
      </section>

      <!-- ====================================================================
           SUBJECTS CATALOGUE BENTO GRID
           ==================================================================== -->
      <section class="subjects-section">
        <div class="section-title-strip">
          <div class="title-left">
            <h2 class="cell-header">available courseware</h2>
            <span class="section-subtext">SELECT A SUBJECT TO EXPLORE NOTES, PYQS AND PRESENTATIONS</span>
          </div>
          <span class="count-pill" *ngIf="!loading">
            COUNT: {{ filtered.length }}
          </span>
        </div>

        <!-- Loading State -->
        <div class="status-cell" *ngIf="loading">
          <div class="brutal-loader">[ LOADING_REPOSITORY_DATA... ]</div>
        </div>

        <!-- Error State -->
        <div class="status-cell error-cell" *ngIf="error && !loading">
          <p>⚠️ UNABLE TO CONNECT TO REPOSITORY BACKEND (http://localhost:8080).</p>
          <button class="btn btn-brutal" (click)="loadSubjects()">[ RETRY CONNECTION ]</button>
        </div>

        <!-- Empty Results -->
        <div class="status-cell empty-cell" *ngIf="!loading && !error && filtered.length === 0">
          <p>[ NO MATCHING SUBJECTS FOUND{{ searchQuery ? ' FOR "' + searchQuery + '"' : '' }} ]</p>
          <button class="btn btn-brutal" *ngIf="searchQuery" (click)="searchQuery = ''; onSearch()">
            [ CLEAR QUERY ]
          </button>
        </div>

        <!-- Courseware Cards Grid -->
        <div class="subjects-grid" *ngIf="!loading && !error && filtered.length > 0">
          <article
            class="subject-cell bento-cell"
            *ngFor="let subject of filtered"
            [routerLink]="['/subject', subject.id]"
          >
            <!-- Card Top Bar: Status line & Enter Arrow with high-visibility status header -->
            <div
              class="cell-top-bar"
              [class.bar-live]="isSubjectLive(subject)"
              [class.bar-deprecated]="!isSubjectLive(subject)"
            >
              <span class="status-tag">
                <span class="status-bullet">●</span>
                {{ isSubjectLive(subject) ? 'LIVE' : 'DEPRECATED' }}
              </span>
              <span class="enter-arrow">OPEN →</span>
            </div>

            <!-- Subject Body with Code placed below Name -->
            <div class="subject-content">
              <h3 class="subject-name">{{ subject.name }}</h3>
              <div class="subject-code-row">
                <span class="card-code-badge">{{ subject.code }}</span>
              </div>
              <p class="subject-desc">
                {{ subject.description || 'Verified lecture notes, past exams, and presentation slides.' }}
              </p>
            </div>

            <!-- Folder Contents Strip -->
            <div class="card-folders-bar">
              <span class="folder-chip" [class.has-content]="subject.folders && subject.folders['NOTES']">
                NOTES {{ (subject.folders && subject.folders['NOTES']) ? '✓' : '0' }}
              </span>
              <span class="folder-chip" [class.has-content]="subject.folders && subject.folders['PYQS']">
                PYQS {{ (subject.folders && subject.folders['PYQS']) ? '✓' : '0' }}
              </span>
              <span class="folder-chip" [class.has-content]="subject.folders && subject.folders['PPTS']">
                PPTS {{ (subject.folders && subject.folders['PPTS']) ? '✓' : '0' }}
              </span>
            </div>
          </article>
        </div>
      </section>

    </div>

    <!-- Contribute Popup Modal (Triggered exclusively via popup button) -->
    <app-contribute-modal
      *ngIf="showUploadModal"
      (modalClosed)="showUploadModal = false"
    ></app-contribute-modal>
  `,
  styles: [`
    .home-container {
      display: flex;
      flex-direction: column;
      gap: clamp(24px, 4vw, 36px);
    }

    /* Search Query Cell */
    .search-section {
      width: 100%;
    }

    .search-box-cell {
      display: flex;
      align-items: center;
      background: var(--input-bg);
      border: var(--border-width) solid var(--border);
      box-shadow: 6px 6px 0 var(--border);
      transition: box-shadow 0.1s ease;
    }

    .search-box-cell:focus-within {
      box-shadow: 8px 8px 0 var(--blue-header);
    }

    .search-prefix {
      font-family: var(--font-mono);
      font-weight: 900;
      font-size: 0.92rem;
      padding: 16px 20px;
      background: var(--yellow);
      color: #000000;
      border-right: var(--border-width) solid var(--border);
      flex-shrink: 0;
      letter-spacing: 0.05em;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      padding: 16px 20px;
      font-family: var(--font-mono);
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--ink);
    }

    .search-input::placeholder {
      color: var(--muted);
      font-weight: 600;
    }

    .clear-btn {
      font-family: var(--font-mono);
      font-weight: 900;
      font-size: 0.85rem;
      background: transparent;
      border: none;
      padding: 14px 20px;
      cursor: pointer;
      color: var(--red);
      flex-shrink: 0;
    }

    .clear-btn:hover {
      background: var(--red);
      color: #FFFFFF;
    }

    /* Subjects Section */
    .subjects-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-title-strip {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: var(--border-thin) solid var(--border);
      padding-bottom: 12px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .title-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .section-subtext {
      font-family: var(--font-mono);
      font-size: 0.76rem;
      font-weight: 700;
      color: var(--muted);
      letter-spacing: 0.04em;
    }

    .count-pill {
      font-family: var(--font-mono);
      font-weight: 900;
      font-size: 0.85rem;
      background: var(--ink);
      color: var(--yellow);
      padding: 6px 12px;
      border: 2px solid var(--border);
      box-shadow: 3px 3px 0 var(--border);
    }

    /* Subjects Grid */
    .subjects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr));
      gap: clamp(20px, 3vw, 28px);
    }

    .subject-cell {
      cursor: pointer;
      display: flex;
      flex-direction: column;
      padding: 0;
      text-decoration: none;
      color: var(--ink);
      background: var(--bg-card);
      border: var(--border-width) solid var(--border);
      box-shadow: 6px 6px 0 var(--border);
      transition: transform 0.08s ease, box-shadow 0.08s ease;
    }

    .subject-cell:hover {
      transform: translate(-2px, -2px);
      box-shadow: 8px 8px 0 var(--border);
      background: var(--bg-card-hover);
    }

    .subject-cell:active {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 var(--border);
    }

    .cell-top-bar {
      padding: 10px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--border);
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .cell-top-bar.bar-live {
      background: var(--green);
      color: #000000;
    }

    .cell-top-bar.bar-deprecated {
      background: var(--red);
      color: #FFFFFF;
    }

    .status-tag {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 900;
      letter-spacing: 0.06em;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .status-bullet {
      font-size: 0.85rem;
    }

    .enter-arrow {
      font-family: var(--font-mono);
      font-weight: 900;
      font-size: 0.82rem;
      letter-spacing: 0.04em;
    }

    .cell-top-bar.bar-live .enter-arrow {
      color: #000000;
    }

    .cell-top-bar.bar-deprecated .enter-arrow {
      color: #FFFFFF;
    }

    .subject-content {
      padding: clamp(18px, 2.5vw, 24px);
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 12px;
    }

    .subject-code-row {
      display: flex;
      align-items: center;
      margin-top: 2px;
      margin-bottom: 4px;
    }

    .card-code-badge {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      font-weight: 900;
      background: var(--yellow);
      color: #000000;
      border: 1.5px solid var(--border);
      box-shadow: 2px 2px 0 var(--border);
      padding: 3px 10px;
      letter-spacing: 0.04em;
    }

    .subject-name {
      font-size: 1.3rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      color: var(--ink);
      line-height: 1.25;
    }

    .subject-desc {
      font-size: 0.9rem;
      color: var(--muted);
      line-height: 1.55;
      flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-folders-bar {
      border-top: 2px solid var(--border);
      background: var(--sub-bar-bg);
      padding: 10px 16px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .folder-chip {
      font-family: var(--font-mono);
      font-size: 0.74rem;
      font-weight: 800;
      padding: 4px 10px;
      border: 1.5px solid var(--border);
      background: var(--bg-card);
      color: var(--muted);
    }

    .folder-chip.has-content {
      background: var(--yellow);
      color: #000000;
      font-weight: 900;
    }

    .status-cell {
      background: var(--bg-card);
      border: var(--border-width) solid var(--border);
      box-shadow: 6px 6px 0 var(--border);
      padding: 48px 24px;
      text-align: center;
      font-family: var(--font-mono);
      font-weight: 900;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
    }

    .error-cell {
      border-color: var(--red);
      color: var(--red);
    }
  `]
})
export class HomeComponent implements OnInit {
  subjects: Subject[] = [];
  filtered: Subject[] = [];
  searchQuery = '';
  loading = true;
  error = false;
  showUploadModal = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.loading = true;
    this.error = false;
    this.api.getSubjects().subscribe({
      next: (data) => {
        this.subjects = data;
        this.applySearch();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.applySearch();
  }

  applySearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filtered = this.subjects;
      return;
    }
    this.filtered = this.subjects.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.description ?? '').toLowerCase().includes(q)
    );
  }

  isSubjectLive(s: Subject): boolean {
    if (s.isLive !== undefined && s.isLive !== null) return s.isLive;
    if (s.live !== undefined && s.live !== null) return s.live;
    return true;
  }
}