import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError,filter,map,tap, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import  {jwtDecode} from 'jwt-decode';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  private previousUrl: string = '';
  private currentUrl: string;

  updateSubject = new Subject<void>();

  private router = inject(Router);

  private usernameSource = new BehaviorSubject<string>('');
  currentUsername = this.usernameSource.asObservable();

  private baseUrl = 'http://localhost:8181/user/auth/'; 
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userRoleSubject = new BehaviorSubject<string | null>(null); 

  constructor(private http: HttpClient) {
    this.currentUrl = this.router.url;
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.previousUrl = this.currentUrl;
      this.currentUrl = event.urlAfterRedirects;
    });
  }

  notifyUpdate() {
    this.updateSubject.next();
  }

  /* login */

  login(username: string, password: string): Observable<any> {
    const url = `${this.baseUrl}login`;
    const user = { username, password };
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
  
    return this.http.post(url, user, httpOptions).pipe(
      map((response: any) => {
        const body = response.body || response; 
      
        if (body && body.token && body.role && body.permission) {
          const token = body.token;
          const role = body.role;
          const permissions = body.permission;
      
          localStorage.setItem('token', token);
          localStorage.setItem('role', role);
          localStorage.setItem('permissions', JSON.stringify(permissions));
      
          this.isAuthenticatedSubject.next(true);
          this.userRoleSubject.next(role);
      
          if (role === "ADMIN") {
            this.router.navigate(['dashboard']);
          } else {
            this.router.navigate(['/user-dashboard']);
          }
      
          return body;
        } else {
          console.error('Invalid login response:', response);
          throw new Error('Invalid login credentials');
        }
      }),
      catchError(error => this.handleError(error))
    );
  }
  

  //

  getPermissions(): any[] {
    const permissions = localStorage.getItem('permissions');
    return permissions ? JSON.parse(permissions) : [];
  }

  getPermissionNames(): string[] {
    return this.getPermissions().map(p => p.permission);
  }
  

  // ---------------------------------------------------------

  private handleError(error: any) {
    let errorMessage: string;
    if (error.error instanceof ErrorEvent) {
      
      errorMessage = 'An error occurred: ' + error.error.message;
    } else {
      
      errorMessage = `Backend returned code ${error.status}: ${error.message}`;
    }
    return throwError(errorMessage);
  }

  isLoggedIn() {
    return !!localStorage.getItem('token');
  }


  getRole(): string  {
    return localStorage.getItem('role') || '';
  }

  getActiveRoute(): string {
    return this.previousUrl;
  }

  setRoute(route: string) {
    this.previousUrl = route;
  }

  getUsernameFromToken(): any {
    const token = localStorage.getItem('token');
    if (!token) {
      return '';
    }
  
    const decodedToken = jwtDecode(token);
    return decodedToken.sub;
  }
}
