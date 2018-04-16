Apurato (あプラト)
==============
[![GitHub release](https://img.shields.io/github/release/afroraydude/anonymous-chat.svg)]() [![Github commits (since latest release)](https://img.shields.io/github/commits-since/afroraydude/anonymous-chat/latest.svg)]()

## Welcome!
This project is a sort of semi-anonymous chat web application and server application. Usage is simple, and all users can be identified via an "anonid" that is generated on each time you initiate connection with the server.


## Installation

### Server
Installing the server is an easy 5 step process.

1. Download the latest release of this repository from [here](https://github.com/afroraydude/anonymous-chat/releases/latest)
2. Run `cd server`
3. Run `npm install` or `yarn install` to install all necessary packages
4. Edit the `.env` file to contain your own SSL key and certificate
5. Run `npm start`

### Client

There is no need to install the client web app. Just visit the associated website [here](https://afro-anonchat.firebase.com), however there will be an Electron app coming out soon:tm:

#### What if I want to host myself?

If you want to host the chat app yourself, or use a custom version of it, just run `cd webapp && npm run build` to build the web app. The fully compiled files will be located in `/path/to/project/webapp/build/`
