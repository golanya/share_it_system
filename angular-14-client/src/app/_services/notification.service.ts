import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const NOTIFICATION_API = 'http://localhost:8080/api/notification/';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
/* It's a service that uses the HttpClient to delete a notification */
export class NotificationService {
  constructor(private http: HttpClient) {}

  deleteNotification(id: any): Observable<any> {
    return this.http.delete(NOTIFICATION_API + id);
  }

  markAsSeen(id: any): Observable<any> {
    return this.http.post( NOTIFICATION_API + "mark-as-seen/" + id, {}, httpOptions);
  }

  unwatched_notifications(): Observable<any> {
    return this.http.get(NOTIFICATION_API + "user-unwatched-notifications/");
  }

  notificationsAmount(): Observable<any> {
    return this.http.get(NOTIFICATION_API + "notifications-amount/");
  }
}
