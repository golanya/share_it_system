import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const TOOL_API = 'http://localhost:8080/api/tool/';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
/* It's a service that handles all the HTTP requests related to the tool module */
export class ToolService {
  constructor(private http: HttpClient) {}

  addTool(
    name: string,
    manufacturing_date: any,
    status: string,
    max_time_borrow: any,
    categories: string,
    producer: string,
    owner: any,
    description: string
  ): Observable<any> {
    return this.http.post(
      TOOL_API + 'add',
      {
        name,
        manufacturing_date,
        status,
        max_time_borrow,
        categories,
        producer,
        owner,
        description,
      },
      httpOptions
    );
  }

  deleteRequest(id: any): Observable<any> {
    return this.http.delete(TOOL_API + 'board-tool/requests/' + id, {
      responseType: 'text',
    });
  }

  getRequests(): Observable<any> {
    return this.http.get(TOOL_API + 'board-tool/requests/', {
      responseType: 'text',
    });
  }

  getToolRequests(id: any): Observable<any> {
    return this.http.get(TOOL_API + 'board-tool/requests/' + id, {
      responseType: 'text',
    });
  }

  getAllTools(): Observable<any> {
    return this.http.get(TOOL_API + 'tools', { responseType: 'text' });
  }

  getToolsAmount(): Observable<any> {
    return this.http.get(TOOL_API + 'tools-amount');
  }

  getPendingRequestsAmount(): Observable<any> {
    return this.http.get(TOOL_API + 'pending-requests-amount');
  }

  getRequestsByFilter(filter: any): Observable<any> {
    return this.http.post(TOOL_API + 'tools/requests-by-filter/', filter, httpOptions);
  }

  getToolById(id: string): Observable<any> {
    return this.http.get(TOOL_API + 'board-tool/' + id);
  }

  deleteToolById(id: string): Observable<any> {
    return this.http.delete(TOOL_API + 'board-tool/' + id, {
      responseType: 'text',
    });
  }

  requestTool(
    id: string,
    expiration_date: Date,
    borrow_duration: string,
    content: string
  ): Observable<any> {
    return this.http.post(
      TOOL_API + 'board-tool/' + id,
      {
        expiration_date: expiration_date,
        borrow_duration: borrow_duration,
        content: content,
      },
      httpOptions
    );
  }

  updateRequest(
    id: string,
    content: string,
    borrow_duration: string,
    expiration_date: Date
  ): Observable<any> {
    return this.http.post(
      TOOL_API + 'board-tool/request/' + id,
      {
        expiration_date: expiration_date,
        borrow_duration: borrow_duration,
        content: content,
      },
      httpOptions
    );
  }

  updateRequestStatus(
    id: string,
    status: string,
    expiration_date: Date
  ): Observable<any> {
    return this.http.post(
      TOOL_API + 'board-tool/request_status/' + id,
      {
        status: status,
        expiration_date: expiration_date,
      },
      httpOptions
    );
  }

  feedbackPeer(
    id: string,
    request_id: string,
    feedback: boolean
  ): Observable<any> {
    return this.http.post(
      TOOL_API + 'board-tool/request/feedback',
      {
        id: id,
        request_id: request_id,
        feedback: feedback,
      },
      httpOptions
    );
  }

  editTool(id: string, params: any): Observable<any> {
    return this.http.post(TOOL_API + 'update/' + id, params, httpOptions);
  }

  getToolHistory(id: string): Observable<any> {
    return this.http.get(TOOL_API + 'tool-history/' + id);
  }

  getMyTools(): Observable<any> {
    return this.http.get(TOOL_API + 'my_tools');
  }

  getMyBorrows(): Observable<any> {
    return this.http.get(TOOL_API + 'my_borrows');
  }

  getMyNotifications(): Observable<any> {
    return this.http.get(TOOL_API + 'my_notifications');
  }
}
