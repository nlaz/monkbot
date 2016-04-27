/**
 *     _____         _   _____     _   
 *    |     |___ ___| |_| __  |___| |_ 
 *    | | | | . |   | '_| __ -| . |  _|
 *    |_|_|_|___|_|_|_,_|_____|___|_|  
 *
 *  Your Slack servant for daily committing
 */

var jsdom         = require("jsdom");
var request       = require("request");
var dateFormat    = require('dateformat');
var sqlite3       = require('sqlite3').verbose();
var RtmClient     = require('@slack/client').RtmClient;
var WebClient     = require('@slack/client').WebClient;
var RTM_EVENTS    = require('@slack/client').RTM_EVENTS;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

var convos = {};
var db;

var DEBUG_LEVEL = 'info'; // 'debug', 'info', 'verbose'

if(!process.env.SLACK_API_TOKEN) {
  var env = require('./env.js')
}

var token = process.env.SLACK_API_TOKEN || '';

var usage = "*MonkBot* - Your courteous Slack reminder to commit daily\n" +
            "`@monkbot help` - Displays list of commands monkbot recognizes.\n" +
            "`@monkbot users` - Displays list of all users.\n" +
            "`@monkbot report` - Report daily commiters.\n" +
            "`@monkbot add me` - Add your name to monkbot's list of committers.";

var rtm = new RtmClient(token, {logLevel: DEBUG_LEVEL});
var web = new WebClient(token);

/* Event Handlers */

// Connection Opened
rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
  console.log('Connection opened');
});

// Connection Closed
rtm.on(CLIENT_EVENTS.RTM.DISCONNECT, function () {
  console.log('Connection closed');
  closeDb();
});

// Message Event Handler
rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(data) {
  // Parse string and check commands
  var command = data['text'];
  var client_id = '<@' + rtm.activeUserId + '>';

  if (command.substring(0, client_id.length) == client_id) {
    // Bot has been summoned
    command = command.substring(client_id.length + 1).trim();

    switch (command) {
      case 'help':
        rtm.sendMessage(usage, data['channel']);
        break;
      case 'add me':
        fetchGitHub(data['user'], rtm, data['channel']);
        break;
      case 'users':
        fetchUsers( function(users) {
          var msg = "Here's the list of users I'm tracking...\n";
          rtm.sendMessage(msg + users.join(', '), data['channel']);
        });
        break;
      case 'report':
        fetchUsers( function(users) {
          findDailyCommits(users, function(commits) {
            createReport(commits, rtm, data['channel']);
          });
        });
        break;
      default:
        rtm.sendMessage('Oops! Unable to recognize command. Please try something like:\n' + usage, data['channel']);
    }
  } else if (data['channel'] in convos) {
    // Opened conversation
    name = data['text'];
    checkUserExists(name, function(){
      addUsername(name, rtm, data);
    });
  }
});

/* Helpers */

// Create message showing who has committed
var createReport = function(commits, rtm, channel) {
  var msg = "",
      committed = [], 
      uncommitted = [];

  commits.sort(function(a,b) {
    return b.count - a.count;
  });

  commits.forEach( function(c) {
    (c.count > 0) ? committed.push(c) : uncommitted.push(c.name);
  });

  msg += "*Here's who committed today! :hand:*\n";
  committed.forEach( function(c) {
    msg += " - " +  c.name + " committed " + c.count + " times today!\n";
  });

  msg += "\n*Here's who hasn't committed yet today :sweat:*\n";
  msg += '_' + uncommitted.join(', ') + '_';

  rtm.sendMessage(msg, channel);
}

// Ask for Github username
var fetchGitHub = function(user, rtm, channel) {
  web.im.open(user, function imOpenCb(err, info) {
    if (err) {
      console.log('IM ERROR:', err);
    } else {
      var convo = info['channel']['id'];
      convos[convo] = user;
      rtm.sendMessage('Cool! I will message you for your username.', channel);
      rtm.sendMessage('Hi! What is your GitHub username?', convo);
    }
  });
}

// Find number of commits today for each user
var findDailyCommits = function(users, callback) {
  var commits = [];
  var namesProcessed = 0;
  users.forEach( function(name, index, array) {
    var url = "https://github.com/" + name;
    var selector = "g rect[data-date='" + dateFormat(new Date(), "isoDate") + "']";

    jsdom.env(
      url,
      ["http://code.jquery.com/jquery.js"],
      function (err, window) {
        var count = window.$(selector).attr("data-count");
        commits.push({name: name, count: count});
        namesProcessed++;
        if (namesProcessed == array.length){
          callback(commits);
        }
      }
    );
  });
}

// Check username is a GitHub name
var addUsername = function(name, rtm, data) {
  channel = data['channel'];
  var options = {
    url: "https://api.github.com/users/" + name,
    headers: { 'User-Agent': 'monkbot' }
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var info = JSON.parse(body);
      rtm.sendMessage('Got it! Adding ' + name + '...', channel);
      insertUser(data['user'], name);
    } else {
      rtm.sendMessage('Sorry, I had trouble finding ' + name + '...', channel);
    }
  }
  request(options, callback);
}

/* Database Methods */

function createDb() {
  console.log("create database");
  db = new sqlite3.Database('test.db', createTable);
}

function dropTable() {
  console.log("dropping table");
  var query = "DROP TABLE users;"
  db.run(query);
}

function createTable() {
  console.log("create table");
  var query = "CREATE TABLE IF NOT EXISTS users(" +
            "id integer PRIMARY KEY, " +
            "username TEXT, " +
            "github_username TEXT);"
  db.run(query);
}

function closeDb(){
  console.log("closing database");
  db.close();
}

function insertUser(username, github_username) {
  var query = "INSERT INTO users (username, github_username) " +
              "VALUES ('" + username + "', '" + github_username + "');";
  db.run(query);
}

function checkUserExists(name, callback) {
  var query = 'SELECT github_username FROM users WHERE github_username = "' + name + '";';
  console.log(query);
  db.all(query, function(err, rows) {
    if (rows.length == 0) {
      callback()
    }
  });
}

function fetchUsers(callback) {
  var query = "SELECT github_username FROM users;";
  var list = [];
  db.all(query, function(err, rows) {
    rows.forEach(function (row) {
      list.push(row['github_username']);
    });
    callback(list);
  });
}

/* Run process */

createDb();
rtm.start();