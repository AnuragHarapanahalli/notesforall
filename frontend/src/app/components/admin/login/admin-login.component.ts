import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-wrapper">
      <div class="mac-window login-window">
        <div class="mac-window-bar">
          <div class="traffic-dots">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
          </div>
          <span class="window-title">admin.login</span>
        </div>

        <div class="login-body">
          <div class="login-header">
            <span class="label">RESTRICTED ACCESS</span>
            <h2>Administrator Portal</h2>
            <p class="login-sub">Only administrators need to sign in. Students and public users can browse and read files freely without logging in.</p>
          </div>

          <div class="error-banner" *ngIf="errorMsg">
            <span>⚠️ {{ errorMsg }}</span>
          </div>

          <form (ngSubmit)="login()" class="login-form">
            <div class="form-field">
              <label for="username">Username</label>
              <input
                id="username"
                type="text"
                class="form-input"
                [(ngModel)]="username"
                name="username"
                placeholder="Enter username"
                required
                autocomplete="username"
              />
            </div>

            <div class="form-field">
              <label for="password">Password</label>
              <input
                id="password"
                type="password"
                class="form-input"
                [(ngModel)]="password"
                name="password"
                placeholder="Enter password"
                required
                autocomplete="current-password"
              />
            </div>

            <button type="submit" class="btn btn-accent submit-btn" [disabled]="loading">
              {{ loading ? 'Authenticating...' : 'Sign In to Dashboard' }}
            </button>
          </form>

          <div class="login-footer">
            <a routerLink="/" class="back-link">← Back to public repository</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: clamp(20px, 4vw, 40px) 16px;
    }

    .login-window {
      width: 100%;
      max-width: 460px;
      border: 4px solid #000000;
      box-shadow: 8px 8px 0 #000000;
    }

    .window-title {
      font-size: 0.8rem;
      font-family: var(--font-mono);
      font-weight: 900;
      color: #000000;
      margin-left: 8px;
    }

    .login-body {
      padding: clamp(24px, 4vw, 36px);
      background: #FFFFFF;
    }

    .login-header {
      margin-bottom: 24px;
      text-align: left;
    }

    .login-header h2 {
      margin: 6px 0 8px;
      font-size: clamp(22px, 3.5vw, 30px);
      font-weight: 900;
    }

    .login-sub {
      color: #555555;
      font-size: 0.84rem;
      font-family: var(--font-mono);
      line-height: 1.4;
    }

    .error-banner {
      background: #FFF0F0;
      border: 2px solid #CC0000;
      color: #CC0000;
      font-family: var(--font-mono);
      font-weight: 800;
      padding: 10px 14px;
      margin-bottom: 20px;
      font-size: 0.84rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-field label {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 800;
      color: #000000;
    }

    .form-input {
      width: 100%;
      padding: 11px 14px;
      background: #FFFFFF;
      border: 2px solid #000000;
      box-shadow: 3px 3px 0 #000000;
      color: #000000;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.92rem;
    }

    .form-input:focus {
      outline: none;
      background: #FFFDF0;
      border-color: #000000;
      box-shadow: 4px 4px 0 var(--blue-header);
    }

    .submit-btn {
      width: 100%;
      margin-top: 8px;
      padding: 12px;
      font-size: 0.9rem;
      background: var(--harsh-orange);
      color: #FFFFFF;
      border: 2px solid #000000;
      box-shadow: 4px 4px 0 #000000;
      font-weight: 900;
      font-family: var(--font-mono);
      cursor: pointer;
      text-transform: lowercase;
    }

    .submit-btn:hover:not(:disabled) {
      background: #E65100;
    }

    .submit-btn:active:not(:disabled) {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 #000000;
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      box-shadow: none;
    }

    .login-footer {
      text-align: center;
      margin-top: 24px;
      border-top: 2px solid #000000;
      padding-top: 16px;
    }

    .back-link {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      font-weight: 800;
      color: var(--blue-header);
      text-decoration: none;
    }

    .back-link:hover {
      text-decoration: underline;
    }
  `]
})
export class AdminLoginComponent {
  username = '';
  password = '';
  loading = false;
  errorMsg = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  login(): void {
    if (!this.username || !this.password) {
      this.errorMsg = 'Please provide both username and password.';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.api.login(this.username, this.password).subscribe({
      next: (res) => {
        this.auth.setToken(res.token);
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.errorMsg = 'Invalid credentials. Please check your username and password.';
        this.loading = false;
      }
    });
  }
}