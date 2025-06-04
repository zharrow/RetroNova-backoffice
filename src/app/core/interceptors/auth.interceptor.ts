import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const firebaseAuth = inject(AngularFireAuth);
  
  return from(getToken(firebaseAuth)).pipe(
    switchMap(token => {
      if (token) {
        const authReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
        return next(authReq);
      }
      return next(req);
    })
  );
};

async function getToken(firebaseAuth: AngularFireAuth): Promise<string | null> {
  const user = await firebaseAuth.currentUser;
  if (user) {
    return user.getIdToken();
  }
  return null;
}