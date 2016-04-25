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

var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

if(!process.env.SLACK_API_TOKEN) 
  var env = require('./env.js');

var token = process.env.SLACK_API_TOKEN || '';

var rtm = new RtmClient(token);
rtm.start();

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  console.log('Message:', message);
});