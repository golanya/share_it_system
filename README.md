# MEAN stack lending and borrowing tools management system

## Install dependencies
#### Server
Enter `node-js-server` folder
Run `npm install`

#### Client
Enter angular-14-client folder
Run `npm install`

## Run
### Node.js Server
Enter `node-js-server` folder
Run `node server.js` for a dev server exporting API at http://localhost:8080/.
- To use remote cluster you can add "--remote" to the server command
- The system will initiated with default admin user with username: `SYSTEM` and password: `123456`
- Currently there are 2 Roles in the system that create with system initialize stage, `admin` and `user`
- Default organization code will be set to `111111`, it required for sign-up process

##### Server environment variables
* SHAREIT_PORT -> determine the port our server going to run with (e.g: 8080)
* SHAREIT_ORG_CODE -> organization code that will be generated with the system initializing
* SHAREIT_SYSTEM_USER_ID -> determine the admin user ID inside the DB
* SHAREIT_USERNAME -> determine admin username that will be generated with the system initializing
* SHAREIT_EMAIL -> determine admin email that will be generated with the system initializing
* SHAREIT_PASSWORD -> determine admin password that will be generated with the system initializing
* SHAREIT_FNAME -> determine admin first name that will be generated with the system initializing
* SHAREIT_LNAME -> determine admin last name that will be generated with the system initializing
* SHAREIT_PHONE -> determine admin phone number that will be generated with the system initializing
* SHAREIT_REMOTE_USERNAME -> for connecting to remote cluster
* SHAREIT_REMOTE_PASSWORD -> for connecting to remote cluster

### Angular Client
Enter angular-14-client folder
Run `ng serve --port 4200`. Navigate to `http://localhost:4200/`.

## `Cron` jobs
### Notifying job
Every specific hour, the system will generate a reminder request for people which currently borrow
tools and the return date is getting closer, to determine the hour of the notification sending,
all we have to do is to change `HOUR_OF_SENDING_NOTIFY` value to the hour we want.
To determine how many hours the system will notify the users before their borrow is going to finish,
all we have to do is to change `NUM_OF_HOURS_BEFORE_EXP` value

### Requests handling
The system has job that does every hour 2 things: rejecting all the requests that expired, closing all the requests that have been approved (active loans).
To play with the timing of this crone job, navigate to server.js, find the function `closeExpiredApprovedRequests` and change the arguments the Crone
job that activate it gets. To learn about how the timing works there, take a look on: `https://www.npmjs.com/package/node-cron`

### Local DB backup
The system take care to generate a backup for the DB every interval of time, it saving it locally using `mongodump` function.
In order to determine how many backups to keep in the folder, you can change the variable: `keepLastDaysBackup`, keep in mind
that `removeOldBackup` has to be set to true as it right now to enjoy this feature of cleaning old backups

