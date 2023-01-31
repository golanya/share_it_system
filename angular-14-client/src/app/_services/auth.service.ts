import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const AUTH_API = 'http://localhost:8080/api/auth/';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
/* The AuthService class is a service that provides methods for logging in, registering, and logging
out. */
export class AuthService {
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(
      AUTH_API + 'signin',
      {
        username,
        password,
      },
      httpOptions
    );
  }

  register(
    fname: string,
    lname: string,
    username: string,
    email: string,
    phone: string,
    password: string,
    organization_code: string,
    job: string,
    description: string,
    allow_emails: boolean
  ): Observable<any> {
    return this.http.post(
      AUTH_API + 'signup',
      {
        fname,
        lname,
        username,
        email,
        phone,
        password,
        organization_code,
        job,
        description,
        allow_emails,
      },
      httpOptions
    );
  }

  logout(): Observable<any> {
    return this.http.post(AUTH_API + 'signout', {}, httpOptions);
  }
}
