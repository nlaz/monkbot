/**
 *     _____          _____  _____  ______ ____   ____ _______ 
 *    / ____|   /\   |  __ \|  __ \|  ____|  _ \ / __ \__   __|
 *   | |       /  \  | |__) | |__) | |__  | |_) | |  | | | |   
 *   | |      / /\ \ |  _  /|  ___/|  __| |  _ <| |  | | | |   
 *   | |____ / ____ \| | \ \| |    | |____| |_) | |__| | | |   
 *    \_____/_/    \_\_|  \_\_|    |______|____/ \____/  |_|   
 *
 *           Your Slack servant for daily committing
 */

require('./env.js');
var request    = require("request");
var sqlite3    = require('sqlite3').verbose();
var RtmClient  = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var WebClient  = require('@slack/client').WebClient;

var convos = {};

var DEBUG_LEVEL = 'info'; // 'debug', 'info', 'verbose'

var token = process.env.SLACK_API_TOKEN || '';
var usage = "*CarpeBot* - Your courteous Slack reminder to commit daily\n" +
            "`@carpebot help` - Displays list of commands carpebot recognizes.\n" +
            "`@carpebot add me` - Add your name to carpebot's list of committers.";

var rtm = new RtmClient(token, {logLevel: DEBUG_LEVEL});
var web = new WebClient(token);

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(data) {
  var command = data['text'];
  var client_id = '<@' + rtm.activeUserId + '>';
  console.log(data['channel']);
  console.log(convos);

  if (command.substring(0, client_id.length) == client_id) {
    // Bot has been summoned
    command = command.substring(client_id.length + 1).trim();
    console.log(command);

    switch (command) {
      case 'help':
        console.log("'help' command recognized");
        rtm.sendMessage(usage, data['channel']);
        break;
      case 'add me':
        console.log("'add me' command recognized");
        console.log(data);
        fetchGitHub(data['user'], rtm, data['channel']);
        break;
      default:
        rtm.sendMessage('Oops! Unable to recognize command. Please try something like:\n' + usage, data['channel']);
    }
  } else if (data['channel'] in convos) {
    // Opened conversation
    console.log('IS YOUR NAME REALLY ' + data['text'] + '?');
    addUsername(data['text'], rtm, data['channel']);
  }
});

var fetchGitHub = function(user, rtm, channel) {
  web.im.open(user, function imOpenCb(err, info) {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('IM Info:', info);
      var convo = info['channel']['id'];
      convos[convo] = user;
      rtm.sendMessage('Hi! What is your GitHub username?', convo);
      rtm.sendMessage('Cool! I messaged you for your username.', channel);
    }
  });
}

var addUsername = function(name, rtm, channel) {
  var options = {
    url: "https://api.github.com/users/" + name,
    headers: {
      'User-Agent': 'CarpeBot'
    }
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var info = JSON.parse(body);
      console.log(info);
      rtm.sendMessage('Got it! Adding ' + name + '...', channel);
    } else {
      rtm.sendMessage('Sorry, I had trouble finding ' + name + '...', channel);
    }
  }

  request(options, callback);
}

rtm.start();