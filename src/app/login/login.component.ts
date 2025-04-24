import { Component, inject, signal } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { ServicesService } from '../services/services.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NavbarComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = signal('');
  password = signal('');
  loginError = signal('');
  showErrorPopup = signal(false);

  usernameWritten = false;
  passwordWritten = false;

  constructor(private authService: ServicesService) {}

  auth = inject(ServicesService);

  login() {
    const usernameValue = this.username();
    const passwordValue = this.password();

    if (!usernameValue || !passwordValue) {
      this.showError('Please enter both username and password.');
      return;
    }

    this.auth.login(usernameValue, passwordValue).subscribe({
      next: (res) => {
        this.loginError.set('');
        const formattedPermissions = res.permission.map((p: any) =>
          p.permission.toUpperCase().replace(/\s+/g, '_')
        );
        const userData = {
          token: res.token,
          role: res.role,
          permissions: formattedPermissions
        };
        console.log('Login successful!', userData);
      },
      error: () => {
        this.showError('Invalid username or password.');
        this.usernameWritten = false;
        this.passwordWritten = false;
      }
    });
  }

  showError(message: string) {
    this.loginError.set(message);
    this.showErrorPopup.set(true);
    setTimeout(() => this.closeErrorPopup(), 5000);
  }

  closeErrorPopup() {
    this.showErrorPopup.set(false);
  }

  onInput(type: 'username' | 'password', event: any) {
    const value = event;
    if (type === 'username') {
      this.username.set(value);
      this.usernameWritten = true;
    } else {
      this.password.set(value);
      this.passwordWritten = true;
    }
  }
}