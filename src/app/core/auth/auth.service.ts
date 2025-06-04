import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;
  
  constructor(
    private firebaseAuth: AngularFireAuth,
    private http: HttpClient
  ) {
    this.firebaseAuth.authState.pipe(
      switchMap(firebaseUser => {
        if (firebaseUser) {
          return this.http.get<User>(`${environment.apiUrl}/users/firebase/${firebaseUser.uid}`).pipe(
            catchError(() => of(null))
          );
        }
        return of(null);
      })
    ).subscribe(user => {
      this.currentUser = user;
    });
  }
  
  login(email: string, password: string): Observable<User | null> {
    return from(this.firebaseAuth.signInWithEmailAndPassword(email, password)).pipe(
      switchMap(credential => {
        if (!credential.user) {
          return throwError(() => new Error('Login failed'));
        }
        
        return this.http.get<User>(`${environment.apiUrl}/users/firebase/${credential.user.uid}`);
      }),
      tap(user => {
        this.currentUser = user;
      })
    );
  }
  
  logout(): Observable<void> {
    return from(this.firebaseAuth.signOut()).pipe(
      tap(() => {
        this.currentUser = null;
      })
    );
  }
  
  getCurrentUser(): User | null {
    return this.currentUser;
  }
  
  isAuthenticated(): Observable<boolean> {
    return this.firebaseAuth.authState.pipe(
      map(user => !!user)
    );
  }
  
  getFirebaseToken(): Observable<string | null> {
    return this.firebaseAuth.idToken;
  }
}