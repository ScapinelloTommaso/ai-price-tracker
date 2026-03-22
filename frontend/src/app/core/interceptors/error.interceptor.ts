import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMsg = '';
      if (error.error instanceof ErrorEvent) {
        // Errore lato client
        errorMsg = `Error: ${error.error.message}`;
      } else {
        // Errore lato server
        errorMsg = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
      console.error('[HTTP Interceptor]', errorMsg);
      // Qui potremmo integrare un toast service per le notifiche visive all'utente
      // alert(errorMsg); 
      return throwError(() => new Error(errorMsg));
    })
  );
};
