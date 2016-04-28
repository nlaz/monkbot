# MonkBot
A Slackbot to keep you committing to open source projects.

## How it works
Give your GitHub username to Monkbot and it will track your commit progress and it will remind you on Slack if you haven't committed for the day.

## Setup

These are the steps to get the app up and running:

###  Step 1. Clone this repository
Make a local copy of this project and move into the directory.
```
  $ git clone https://github.com/nlaz/monkbot.git
  $ cd starbot
```

### Step 2. Create a bot for your Slack 
Create a new 'Bot' configuration for your team and customize the information. Record the API Token in a file named `env.js` in your project directory like so:
```
  process.env.SLACK_API_TOKEN = '[INSERT SLACK API TOKEN]';
```  

### Step 3. Install dependencies and run locally
You now need to install the dependencies used in the project. You will need [npm](https://docs.npmjs.com/getting-started/installing-node) installed. Once you have that, you will be able to install the Node dependencies with:
 
```
$ npm install
```

### Step 4. Run locally
After installing all the dependencies and configuring your API token, you should now be able to run your bot locally and test it by running the following command:
```
$ node monkbot.js
```
Open your Slack application and try out Monkbot. Note: `@monkbot help` will list the possible commands.

### Contributing
Suggestions and pull requests are welcome! Any questions or suggestions can be sent to [@nikolazaris](https://twitter.com/nikolazaris). Cheers!