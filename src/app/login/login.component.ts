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

  constructor(private authService: ServicesService) {}

  auth = inject(ServicesService);

  login() {
    const usernameValue = this.username();
    const passwordValue = this.password();
  
    if (!usernameValue || !passwordValue) {
      alert('Please enter both username and password.');
      return;
    }
  
    this.auth.login(usernameValue, passwordValue).subscribe({
      next: (res) => {
        console.log('Login successful!', res);
      },
      error: (err) => {
        alert('Login failed: ' + err);
      }
    });
  }
  
}