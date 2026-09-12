import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { ContributeModalComponent } from '../contribute-modal/contribute-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ContributeModalComponent],
  template: `
    <header class="nav-wrapper">
      <nav class="main-nav">
        <div class="nav-inner">
          <!-- Brand -->
          <a routerLink="/" class="nav-brand">
            <div class="brand-box">[#]</div>
            <span class="brand-text">class_notes_vault<span class="brand-ext">.sys</span></span>
          </a>

          <!-- Center/Right Action Area -->
          <div class="nav-right-cluster">
            <!-- High Attraction Contribute Button -->
            <button
              class="btn-contribute-pop"
              (click)="showContributeModal = true"
              title="Submit lecture notes, PYQs, or slides"
            >
              <span class="upload-icon">⚡</span>
              <span>+ CONTRIBUTE NOTE</span>
            </button>

            <!-- Dark / Light Theme Mode Toggle -->
            <button
              class="theme-toggle-brutal"
              (click)="theme.toggleTheme()"
              [title]="theme.currentTheme() === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
              aria-label="Toggle Theme"
            >
              <span class="mode-icon">{{ theme.currentTheme() === 'dark' ? '☀️ LIGHT' : '🌙 DARK' }}</span>
            </button>

            <!-- Admin Area: User Logo icon button (replaces Admin Panel text) -->
            <a
              *ngIf="auth.isLoggedIn()"
              routerLink="/admin"
              routerLinkActive="active-admin"
              class="user-admin-avatar-btn"
              title="Admin Console"
            >
              <span class="avatar-icon">👤</span>
              <span class="avatar-label">ADMIN</span>
            </a>

            <!-- Exit / Logout button when logged in -->
            <button
              *ngIf="auth.isLoggedIn()"
              class="btn-exit-brutal"
              (click)="auth.logout()"
              title="Sign out of admin console"
            >
              [ EXIT ]
            </button>

            <!-- Link to Admin Login when NOT logged in -->
            <a
              *ngIf="!auth.isLoggedIn()"
              routerLink="/admin/login"
              routerLinkActive="active-admin"
              class="user-login-link"
              title="Administrator login"
            >
              <span class="avatar-icon">👤</span>
            </a>
          </div>
        </div>
      </nav>
    </header>

    <!-- Student Contribution Modal -->
    <app-contribute-modal
      *ngIf="showContributeModal"
      (modalClosed)="showContributeModal = false"
    ></app-contribute-modal>
  `,
  styles: [`
    .nav-wrapper {
      width: 100%;
      background: var(--nav-bg);
      padding: 14px clamp(16px, 3vw, 32px);
      border-bottom: var(--border-width) solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }

    .main-nav {
      max-width: 1380px;
      margin: 0 auto;
      width: 100%;
    }

    .nav-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      flex-wrap: wrap;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--ink);
    }

    .brand-box {
      background: var(--ink);
      color: var(--yellow);
      font-family: var(--font-mono);
      font-weight: 900;
      font-size: 1.15rem;
      padding: 5px 9px;
      border: 2px solid var(--border);
      box-shadow: 2px 2px 0 var(--border);
    }

    .brand-text {
      font-family: var(--font-mono);
      font-weight: 900;
      font-size: 1.2rem;
      letter-spacing: -0.02em;
    }

    .brand-ext {
      color: var(--blue-header);
    }

    .nav-right-cluster {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    /* Pop contribute button */
    .btn-contribute-pop {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-family: var(--font-mono);
    }

    .upload-icon {
      font-size: 1.1rem;
    }

    /* Dark/Light mode brutal button */
    .theme-toggle-brutal {
      background: var(--bg-card);
      color: var(--ink);
      border: 2px solid var(--border);
      box-shadow: 3px 3px 0 var(--border);
      padding: 9px 14px;
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 900;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.1s ease;
      user-select: none;
    }

    .theme-toggle-brutal:hover {
      background: var(--yellow);
      color: #000000;
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 var(--border);
    }

    .theme-toggle-brutal:active {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 var(--border);
    }

    /* User logo beside exit button */
    .user-admin-avatar-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--yellow);
      color: #000000;
      border: 2px solid var(--border);
      box-shadow: 3px 3px 0 var(--border);
      padding: 8px 12px;
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 900;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.08s ease;
    }

    .user-admin-avatar-btn:hover {
      background: #FFE600;
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 var(--border);
    }

    .user-admin-avatar-btn:active,
    .user-admin-avatar-btn.active-admin {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 var(--border);
    }

    .avatar-icon {
      font-size: 1.05rem;
    }

    .avatar-label {
      font-size: 0.78rem;
      letter-spacing: 0.05em;
    }

    /* Exit button */
    .btn-exit-brutal {
      background: var(--bg-card);
      color: var(--red);
      border: 2px solid var(--border);
      box-shadow: 3px 3px 0 var(--border);
      padding: 8px 14px;
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 900;
      cursor: pointer;
      transition: all 0.08s ease;
    }

    .btn-exit-brutal:hover {
      background: var(--red);
      color: #FFFFFF;
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 var(--border);
    }

    .btn-exit-brutal:active {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 var(--border);
    }

    /* User login avatar icon button */
    .user-login-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--bg-card);
      color: var(--ink);
      border: 2px solid var(--border);
      box-shadow: 3px 3px 0 var(--border);
      font-size: 1.15rem;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.08s ease;
    }

    .user-login-link:hover {
      background: var(--yellow);
      color: #000000;
      transform: translate(-1px, -1px);
      box-shadow: 4px 4px 0 var(--border);
    }

    .user-login-link:active {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0 var(--border);
    }
  `]
})
export class NavbarComponent {
  showContributeModal = false;

  constructor(
    public auth: AuthService,
    public theme: ThemeService
  ) {}
}