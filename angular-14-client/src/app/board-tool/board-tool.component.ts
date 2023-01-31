import {
  animate,
  AUTO_STYLE,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../_services/storage.service';
import { ToolService } from '../_services/tool.service';
import { map, shareReplay } from 'rxjs/operators';
import { interval, Observable } from 'rxjs';
import { splitNsName } from '@angular/compiler';

const DEFAULT_DURATION = 3000;
@Component({
  selector: 'app-board-tool',
  templateUrl: './board-tool.component.html',
  styleUrls: ['./board-tool.component.css'],
  animations: [
    trigger('fade', [
      state('false', style({ visibility: AUTO_STYLE, opacity: 0 })),
      state('true', style({ visibility: AUTO_STYLE, opacity: 1 })),
      transition('false => true', animate(1000, style({ opacity: 1 }))),
      transition(
        'true => false',
        animate(DEFAULT_DURATION, style({ opacity: 0 }))
      ),
    ]),
    trigger('collapse', [
      state('false', style({ height: AUTO_STYLE, visibility: AUTO_STYLE })),
      state('true', style({ height: '0', visibility: 'hidden' })),
      transition('false => true', animate(300 + 'ms ease-in')),
      transition('true => false', animate(300 + 'ms ease-out')),
    ]),
  ],
})
export class BoardToolComponent implements OnInit {
  today = this.local_date_to_str(new Date());
  current_year = new Date().getFullYear();
  suspended_user: boolean = false;
  action_msg?: string;
  isBorrowRequestFailed: boolean = false;
  isActionSucceed: boolean = false;
  isActionFailed: boolean = false;
  err_msg?: string;
  tool_id: string = '';
  tool_info: any = {};
  private sub: any;
  requests: any = {
    open: [],
    closed: [],
    all: [],
    approved: null,
    my: null,
    headers: ['#', 'Requestor', 'Expiration date', 'Phone', 'Email'],
    card_attrs: ['Duration', 'Creation date', 'Content', 'Status', 'Rank'],
    approved_list_attrs: [
      'Requestor',
      'Duration',
      'Creation date',
      'Phone',
      'Email',
    ],
    pending_list_attrs: ['Creation date', 'Duration', 'Content'],
    entry_info: [],
  };

  request_model_attr2headers: any = {
    Requestor: 'requestor_name',
    Duration: 'borrow_duration',
    Status: 'status',
    'Creation date': 'date_s',
    Content: 'content',
    Email: 'requestor_email',
    Phone: 'requestor_phone',
    Name: 'name',
    Rank: 'rank',
    'Owner rank': 'owner_rank',
    'Owner name': 'owner_name',
    'Owner phone': 'owner_phone',
    'Max borrow time': 'max_time_borrow',
    Categories: 'categories',
    'Manufactoring date': 'manufacturing_date',
    Producer: 'producer',
    Description: 'description',
    'Expiration date': 'expiration_date_',
  };

  tool_history_to_display = {
    To: 'expiration_date',
    From: 'approval_date',
    Borrower: 'requestor_name',
    Username: 'requestor_username',
  };

  tool_info_to_display = [
    'Name',
    'Owner name',
    'Owner phone',
    'Owner rank',
    'Status',
    'Max borrow time',
    'Categories',
    'Manufactoring date',
    'Producer',
    'Description',
  ];

  edit_state: boolean = false;
  tool_form: any = {
    name: null,
    manufacturing_date: null,
    status: null,
    max_time_borrow: null,
    categories: null,
    producer: null,
    description: null,
  };

  statuses = ['available', 'not available', 'broken'];

  form: any = {
    expiration_date: null,
    borrow_duration: 1,
    content: '',
  };
  approved_borrow_left_time$?: Observable<any>;
  pending_borrow_left_time$?: Observable<any>;

  constructor(
    private route: ActivatedRoute,
    private toolService: ToolService,
    private storageService: StorageService,
    private router: Router
  ) {}

  /**
   * The function is called when the page loads and it gets the tool info from the database and
   * displays it on the page.
   */
  ngOnInit() {
    this.suspended_user = this.storageService.getUser().is_suspended;
    this.sub = this.route.params.subscribe(async (params) => {
      this.tool_id = params['id'];
      this.get_tool_requests();
      this.toolService.getToolById(this.tool_id).subscribe({
        next: async (data) => {
          this.tool_info = data.tool;
          this.get_tool_history();
          this.tool_info.owner_rank = this.tool_info.owner.rank;
          this.tool_info.owner_name = `${this.capitalize_strings(
              this.tool_info.owner.fname
            )} ${this.capitalize_strings(this.tool_info.owner.lname)}`;
          this.tool_info.owner_phone = this.tool_info.owner.phone;
          if (this.tool_info) {
            this.tool_info.is_my_tool =
              this.storageService.getUser().username ===
              this.tool_info.owner.username; // Display delete btn
          } else {
            this.parse_error_msg('Tool was not found');
            await this.display_alert(false);
            this.router.navigate(['tools']);
          }
          this.cp_tool_to_form();
        },
        error: async (err) => {
          this.parse_error_msg(err);
          await this.display_alert(false);
          this.router.navigate(['tools']);
        },
      });
    });
  }

  /**
   * This function gets all the requests for a tool and then divides them into the appropriate arrays.
   */
  get_tool_requests() {
    this.toolService.getToolRequests(this.tool_id).subscribe({
      next: (data) => {
        this.requests.all = JSON.parse(data).requests;
        this.devide_requests();
      },
      error: async (err) => {
        this.parse_error_msg(err);
        await this.display_alert(false);
        this.router.navigate(['tools']);
      },
    });
  }

  /**
   * When the component is destroyed, unsubscribe from the observable.
   */
  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  /**
   * If the user confirms the deletion of the tool, the tool is deleted from the database and the user
   * is redirected to the home page
   */
  delete_tool() {
    if (confirm(`Are you sure to delete ${this.tool_info.name}?`)) {
      this.toolService.deleteToolById(this.tool_id).subscribe({
        next: async (data) => {
          this.action_msg = JSON.parse(data).message;
          // Print success popup
          // navigate home
          await this.display_alert(true);
          this.router.navigate(['tools']);
        },
        error: async (err) => {
          this.parse_error_msg(err);
          await this.display_alert(false);
        },
      });
    }
  }

  /**
   * It takes an array of objects, and for each object, it adds a new property to it, and then pushes
   * it to another array.
   *
   * Generally it just sort the system's requests
   */
  devide_requests() {
    for (let i = 0; i < this.requests.all.length; i++) {
      this.requests.all[i].date_s = this.date2str(this.requests.all[i].date);
      this.requests.all[i].rank = this.requests.all[i].requestor.rank;
      this.requests.all[i].requestor_name =
        this.requests.all[i].requestor.fname +
        ' ' +
        this.requests.all[i].requestor.lname;
      this.requests.all[i].requestor_phone =
        this.requests.all[i].requestor.phone;
      this.requests.all[i].requestor_email =
        this.requests.all[i].requestor.email;
      if (this.requests.all[i].status === 'pending') {
        this.requests.all[i].expiration_date_ = this.date2str(
          this.requests.all[i].expiration_date
        );
        this.requests.open.push(this.requests.all[i]);
        if (
          this.requests.all[i].requestor._id ===
          this.storageService.getUser().id
        ) {
          this.requests.my = this.requests.all[i];

          this.pending_borrow_left_time$ = interval(1000).pipe(
            map((x) =>
              this.calcDateDiff(new Date(this.requests.my.expiration_date))
            ),
            shareReplay(1)
          );
        }
      } else if (this.requests.all[i].status === 'approved') {
        this.approved_borrow_left_time$ = interval(1000).pipe(
          map((x) =>
            this.calcDateDiff(new Date(this.requests.approved.expiration_date))
          ),
          shareReplay(1)
        );

        this.requests.approved = this.requests.all[i];
        if (
          this.requests.all[i].requestor._id ===
          this.storageService.getUser().id
        ) {
          this.requests.my = this.requests.all[i];
        }
      } else {
        this.requests.closed.push(this.requests.all[i]);
      }
    }
  }

  /**
   * It sends a request to the server to update the feedback of a request.
   *
   * The function is called when the user clicks on a button.
   *
   * @param {boolean} encourage - boolean - true if the user is giving positive feedback, false if
   * negative
   */
  feedback_peer(encourage: boolean) {
    this.toolService
      .feedbackPeer(
        this.storageService.getUser().id,
        this.requests.approved._id,
        encourage
      )
      .subscribe({
        next: async (data) => {
          this.action_msg = data.message;
          // Print success popup
          // navigate home
          this.requests.approved.owner_feedback = data.request.owner_feedback;
          this.requests.approved.my_feedback = data.request.my_feedback;
          await this.display_alert(true);
        },
        error: async (err) => {
          this.parse_error_msg(err);
          await this.display_alert(false);
        },
      });
  }

  /**
   * It sends a request to the server to borrow a tool, and if the request is successful, it displays a
   * message to the user.
   *
   * @returns an observable.
   */
  open_new_request() {
    if (!this.validate_input()) {
      // Do something
      return;
    }
    let expiration_date = new Date(this.form.expiration_date);
    expiration_date.setMinutes(59);
    expiration_date.setSeconds(59);
    expiration_date.setHours(23);

    this.toolService
      .requestTool(
        this.tool_id,
        expiration_date,
        this.form.borrow_duration,
        this.form.content || ''
      )
      .subscribe({
        next: async (data) => {
          // For UI:
          this.action_msg = data.message;

          data.request.date_s = this.date2str(data.request.date);
          data.request.expiration_date_ = this.date2str(
            data.request.expiration_date
          );
          this.requests.my = data.request;
          this.requests.open.push(data.request);
          this.requests.all.push(data.request);

          this.pending_borrow_left_time$ = interval(1000).pipe(
            map((x) =>
              this.calcDateDiff(new Date(this.requests.my.expiration_date))
            ),
            shareReplay(1)
          );

          await this.display_alert(true);
        },
        error: async (err) => {
          this.parse_error_msg(err);
          await this.display_alert(false);
        },
      });
  }

  /**
   * It returns true if the input is valid, and false if it is not.
   * @returns A boolean value.
   */
  validate_input(): boolean {
    return true;
  }

  /**
   * "If the user confirms that they want to close the loan, then update the request status to closed,
   * update the tool status to available, and update the request history."
   * The function is called when the user clicks a button.
   *
   * I'm using async/await in the subscribe function because I want to make sure that the UI is updated
   * before the alert is displayed.
   *
   * I'm using async/await in the display_alert function because I want to make sure that the alert is
   * displayed before the function returns.
   */
  finish_loan() {
    if (confirm('Are you sure to close the current loan?')) {
      const now = new Date();
      this.toolService
        .updateRequestStatus(this.requests.approved._id, 'closed', now)
        .subscribe({
          next: async (data) => {
            // For UI:
            this.action_msg = data.message;
            this.tool_info.status = 'available';
            this.requests.approved.status = 'closed';
            this.requests.closed.push(this.requests.approved);

            this.requests.approved = null;
            this.approved_borrow_left_time$ = undefined;

            this.get_tool_history();
            await this.display_alert(true);
          },
          error: async (err) => {
            this.parse_error_msg(err);
            await this.display_alert(false);
          },
        });
    }
  }

  /**
   * If the error object has an error property, try to parse it as JSON and get the message property.
   * If that fails, use the statusText property. If the error object doesn't have an error property,
   * use the statusText property.
   * </code>
   * @param {any} err - any - the error object
   */
  parse_error_msg(err: any) {
    let message = '';

    if (err.error) {
      try {
        if (typeof err.error === 'string') {
          message = JSON.parse(err.error).message;
        } else {
          message = err.error.message;
        }
      } catch {
        message = err.statusText;
      }
    }

    this.action_msg = `Error with status: ${err.status} - ${message}`;
  }

  /**
   * It deletes a pending request from the database and then removes it from the UI
   */
  delete_pending_request() {
    this.toolService.deleteRequest(this.requests.my._id).subscribe({
      next: async (data) => {
        // For UI:
        const res = JSON.parse(data);
        this.action_msg = res.message;
        let index = this.requests.open.indexOf(this.requests.my);
        if (index > -1) {
          this.requests.open.splice(index, 1);
        }
        index = this.requests.all.indexOf(this.requests.my);
        if (index > -1) {
          this.requests.all.splice(index, 1);
        }
        this.requests.my = null;
        await this.display_alert(true);
      },
      error: async (err) => {
        this.parse_error_msg(err);
        let index = this.requests.open.indexOf(this.requests.my);
        if (index > -1) {
          this.requests.open.splice(index, 1);
        }
        index = this.requests.all.indexOf(this.requests.my);
        if (index > -1) {
          this.requests.all.splice(index, 1);
        }
        await this.display_alert(false);
      },
    });
  }

  /**
   * It returns a promise that resolves after a given number of seconds.
   * @param {number} sec - number - The number of seconds to wait before resolving the promise.
   * @returns A promise that will resolve after the specified number of seconds.
   */
  delay(sec: number) {
    return new Promise((resolve) => setTimeout(resolve, sec * 1000));
  }

  /**
   * If the is_sucess parameter is true, then set isActionFailed to false, set isActionSucceed to true,
   * wait 3 seconds, set isActionSucceed to false, wait 3 seconds, set action_msg to an empty string.
   *
   * If the is_sucess parameter is false, then set isActionFailed to true, set isActionSucceed to
   * false, wait 3 seconds, set isActionFailed to false, wait 3 seconds, set action_msg to an empty
   * string.
   * @param {boolean} is_sucess - boolean - this is a boolean value that determines whether the action
   * was successful or not.
   */
  async display_alert(is_sucess: boolean) {
    if (is_sucess) {
      this.isActionFailed = false;
      this.isActionSucceed = true;
      await this.delay(3);
      this.isActionSucceed = false;
    } else {
      this.isActionFailed = true;
      this.isActionSucceed = false;
      await this.delay(3);
      this.isActionFailed = false;
    }
    await this.delay(3);
    this.action_msg = '';
  }

  /**
   * It takes in an index and a request type, and then sets the show property of the request at that
   * index to false.
   * @param {any} i - the index of the request in the array
   * @param {string} req_type - string - this is the type of request, i.e. "pending", "approved",
   * "denied"
   */
  collapse(i: any, req_type: string) {
    this.requests[req_type][i].show = false;
  }

  /**
   * It takes in an index and a request type, and then sets the show property of the object at that
   * index to true.
   * @param {any} i - the index of the request in the array
   * @param {string} req_type - string - this is the type of request, i.e. "pending", "approved",
   * "denied"
   */
  expand(i: any, req_type: string) {
    this.requests[req_type][i].show = true;
  }

  /**
   * It takes a request object, updates the status to 'approved', and then moves the request object
   * from the 'open' array to the 'approved' array.
   * @param {any} i - any = index of the request in the array
   */
  approve_borrow(i: any) {
    const now = new Date().getTime();
    let new_expiration_date = new Date(
      now + 86400000 * this.requests.open[i].borrow_duration
    );
    new_expiration_date.setMinutes(0);
    new_expiration_date.setSeconds(0);
    new_expiration_date.setHours(new_expiration_date.getHours() + 1);
    this.toolService
      .updateRequestStatus(
        this.requests.open[i]._id,
        'approved',
        new_expiration_date
      )
      .subscribe({
        next: async (data) => {
          // For UI:
          this.tool_info.status = 'loaned';
          this.action_msg = data.message;
          this.requests.open[i].status = 'approved';

          let index = this.requests.open.indexOf(this.requests.open[i]);
          if (index > -1) {
            this.requests.approved = this.requests.open.splice(index, 1)[0];
          }

          this.approved_borrow_left_time$ = interval(1000).pipe(
            map((x) =>
              this.calcDateDiff(
                new Date(new_expiration_date)
              )
            ),
            shareReplay(1)
          );

          this.get_tool_history();
          await this.display_alert(true);
        },
        error: async (err) => {
          this.parse_error_msg(err);
          await this.display_alert(false);
        },
      });
  }

  /**
   * "This function is called when a user clicks a button to reject a request to borrow a tool."
   * </code>
   * @param {any} i - any - the index of the request in the array
   */
  reject_borrow(i: any) {
    const now = new Date();
    this.toolService
      .updateRequestStatus(this.requests.open[i]._id, 'rejected', now)
      .subscribe({
        next: async (data) => {
          // For UI:
          this.action_msg = data.message;
          this.requests.open[i].status = 'rejected';

          let index = this.requests.open.indexOf(this.requests.open[i]);
          if (index > -1) {
            this.requests.closed.push(this.requests.open.splice(index, 1)[0]);
          }
          await this.display_alert(true);
        },
        error: async (err) => {
          this.parse_error_msg(err);
          await this.display_alert(false);
        },
      });
  }

  /**
   * This function gets the tool history from the server and displays it in the UI.
   */
  get_tool_history() {
    this.toolService.getToolHistory(this.tool_id).subscribe({
      next: async (data) => {
        // For UI:
        this.tool_info.history = data.history;
      },
      error: async (err) => {
        this.parse_error_msg(err);
        await this.display_alert(false);
      },
    });
  }

  /**
   * It takes a date as an argument and returns an object with the number of hours, minutes and seconds
   * until that date.
   * @param {Date} endDay - Date = new Date('1-3-2023 11:00:00')
   * @returns An object with three properties: hoursToDday, minutesToDday, and secondsToDday.
   */
  calcDateDiff(endDay: Date = new Date('1-3-2023 11:00:00')): any {
    const dDay = endDay.valueOf();

    const milliSecondsInASecond = 1000;
    const hoursInADay = 24;
    const minutesInAnHour = 60;
    const secondsInAMinute = 60;

    const timeDifference = dDay - Date.now();

    if (timeDifference <= 0) {
      return {
        hoursToDday: 0,
        minutesToDday: 0,
        secondsToDday: 0,
      };
    }

    const daysToDday = Math.floor(
      timeDifference /
        (milliSecondsInASecond *
          minutesInAnHour *
          secondsInAMinute *
          hoursInADay)
    );

    const hoursToDday = Math.floor(
      (timeDifference /
        (milliSecondsInASecond * minutesInAnHour * secondsInAMinute)) %
        hoursInADay
    );

    const minutesToDday = Math.floor(
      (timeDifference / (milliSecondsInASecond * minutesInAnHour)) %
        secondsInAMinute
    );

    const secondsToDday =
      Math.floor(timeDifference / milliSecondsInASecond) % secondsInAMinute;

    return {
      hoursToDday: hoursToDday + hoursInADay * daysToDday,
      minutesToDday: minutesToDday,
      secondsToDday: secondsToDday,
    };
  }

  /**
   * It takes a date object and returns a string in the format of "YYYY-MM-DD HH:MM:SS"
   * @param {Date} date - Date - The date to be formatted.
   * @returns A string in the format of "MM/DD/YYYY HH:MM:SS"
   */
  date2str(date: Date): string {
    const date_ = new Date(date);

    const hours = (date_.getHours() < 10 ? '0' : '') + date_.getHours();
    const minutes = (date_.getMinutes() < 10 ? '0' : '') + date_.getMinutes();
    const seconds = (date_.getSeconds() < 10 ? '0' : '') + date_.getSeconds();
    return `${date_.toLocaleDateString()} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * It takes a date object and returns a string in the format of YYYY-MM-DD.
   * </code>
   * You can use <code>toISOString()</code> to get the date in ISO format.
   * <code>var date = new Date();
   * var isoDate = date.toISOString();
   * </code>
   * @param {Date} date - Date
   * @returns A string in the format of YYYY-MM-DD
   */
  local_date_to_str(date: Date): string {
    let date_ = new Date(date).toLocaleDateString();
    date_ = date_.replace(/\./g, '/');
    let date_l = date_.split('/');
    let str = date_l.pop() + '-';
    for (let i = 0; i < 2; i++) {
      if (date_l[i].length === 1) {
        str += '0';
      }
      str += date_l[i] + '-';
    }

    return str.slice(0, 10);
  }

  /**
   * It takes a string, slices the first character off, capitalizes it, and then concatenates it with
   * the rest of the string
   * @param {string} str - string - This is the string that we want to capitalize.
   * @returns The first character of the string is being returned in uppercase, and the rest of the
   * string is being returned in lowercase.
   */
  capitalize_strings(str: string): string {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
  }

  /**
   * It takes the form data, compares it to the original data, and if there are any changes, it sends
   * the changes to the server.
   */
  save_changes() {
    this.edit_state = false;

    let changes: any = {};
    let tmp = this.tool_form;
    let tool_info = this.tool_info;
    Object.keys(this.tool_form).forEach(function (key, index) {
      if (tmp[key] !== tool_info[key]) {
        changes[key] = tmp[key];
      }
    });

    this.toolService.editTool(this.tool_id, changes).subscribe({
      next: async (data) => {
        // For UI:
        this.action_msg = data.message;

        this.cp_tool_to_form(true);

        await this.display_alert(true);
      },
      error: async (err) => {
        this.parse_error_msg(err);
        await this.display_alert(false);
      },
    });
  }

  /**
   * It closes the form and copies the data from the form to the tool object.
   */
  closeForm() {
    this.edit_state = false;
    this.cp_tool_to_form();
  }

  /**
   * "For each key in the tool_form object, if reverse is true, set the value of the tool_info object
   * to the value of the tool_form object, otherwise set the value of the tool_form object to the value
   * of the tool_info object."
   *
   * The function is called like this:
   *
   * this.cp_tool_to_form();
   * this.cp_tool_to_form(true);
   *
   * The first call copies the values from the tool_info object to the tool_form object. The second
   * call copies the values from the tool_form object to the tool_info object.
   *
   * I hope this helps.
   * @param {boolean} [reverse=false] - boolean = false
   */
  cp_tool_to_form(reverse: boolean = false) {
    let tmp = this.tool_form;
    let tool_info = this.tool_info;
    Object.keys(this.tool_form).forEach(function (key, index) {
      if (reverse) {
        tool_info[key] = tmp[key];
      } else {
        tmp[key] = tool_info[key];
      }
    });
  }
}
