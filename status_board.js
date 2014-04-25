// Node server requires . . . 
var express = require('express');
var app = express();
var rest = require('restler');
var auth = require('http-auth');
// var config = require('./creds/config');	// comment out if deploying to Heroku
var stylus = require('stylus');

console.log(process.env.BOARD);

// constants for .gitignored local values or Heroku environment constants
var BOARD = process.env.BOARD || config.trello.board;
var APP_KEY = process.env.APP_KEY || config.trello.app_key;
var APP_TOKEN = process.env.APP_TOKEN || config.trello.app_token;
var MEMBER_ALLAN = process.env.MEMBER_ALLAN || config.trello.member_allan;
var MEMBER_GREG = process.env.MEMBER_GREG || config.trello.member_greg;
var MEMBER_STEVE = process.env.MEMBER_STEVE || config.trello.member_steve;
var DOING_LIST = process.env.DOING_LIST || config.trello.doing_list;
var TODO_LIST = process.env.TODO_LIST || config.trello.todo_list;

var USERNAME = process.env.USERNAME || config.authenticate.username;
var PASSWORD = process.env.PASSWORD || config.authenticate.password;

// HTTP authentication
var basic = auth.basic({realm: "Status Board"}, 
	function(username,password,callback) {
		callback(username === USERNAME && password === PASSWORD);
	}
);

app.use(auth.connect(basic));

// Jade configuration
app.set('views', __dirname + '/views')
app.set('view engine', 'jade');

// Stylus configuration
app.use(stylus.middleware({
  src: __dirname + '/resources',
  dest: __dirname,
  force: true
}));

// Static paths for local image, stylesheet and script load
app.use('/images', express.static(__dirname + '/images'));
app.use('/stylesheet', express.static(__dirname + '/stylesheet'));
app.use('/js', express.static(__dirname + '/js'));

// Fire it up
app.listen(8080);

// Routes
app.route('/logo').get(function(req,res) {
	res.render('logo',{title:'Logo'});
});

app.route('/team').get(function(req,res) {
	var team_statuses = [];

	var getStatus = function(member_id,member_name,member_bio) {
		team_statuses.push({id: member_id, name: member_name, status: member_bio});

		if (team_statuses.length === 3) {
			res.render('team',{title:'Team', team_statuses: team_statuses});
		}
	};

	rest.get('https://api.trello.com/1/members/' + MEMBER_ALLAN + '?key=' + APP_KEY + '&token=' + APP_TOKEN, {timeout:10000}).on('complete', function(data){
		getStatus(data.id,data.fullName,data.bio);
	}).on('timeout', function(ms){
  		console.log('Trello did not return MEMBER_ALLAN response within ' + ms + ' ms');
	});

	rest.get('https://api.trello.com/1/members/' + MEMBER_GREG + '?key=' + APP_KEY + '&token=' + APP_TOKEN, {timeout:10000}).on('complete', function(data){
		getStatus(data.id,data.fullName,data.bio);
	}).on('timeout', function(ms){
  		console.log('Trello did not return MEMBER_GREG response within ' + ms + ' ms');
	});

	rest.get('https://api.trello.com/1/members/' + MEMBER_STEVE + '?key=' + APP_KEY + '&token=' + APP_TOKEN, {timeout:10000}).on('complete', function(data){
		getStatus(data.id,data.fullName,data.bio);
	}).on('timeout', function(ms){
  		console.log('Trello did not return MEMBER_STEVE response within ' + ms + ' ms');
	});
});

app.route('/projects').get(function(req,res) {
	rest.get('https://api.trello.com/1/board/' + BOARD + '/cards?key=' + APP_KEY + '&token=' + APP_TOKEN, {timeout:10000}).on('complete', function(data) {
		var arr = data.filter(function(element) {
			return element.idList === DOING_LIST;
		});

		projects = [];

		arr.forEach(function(element,index) {
			var project = {};
			var team = [];

			element.idMembers.forEach(function(element,index) {
				if (element === MEMBER_ALLAN || element === MEMBER_GREG || element === MEMBER_STEVE) {
					team.push(element);
				}
			});

			project.team = team;

			if (element.badges.checkItems === 0) {
				project.bars = 1;
			} else {
				project.bars = Math.ceil((element.badges.checkItemsChecked / element.badges.checkItems) * 8);
			}

			var tempDate = new Date(element.due);
			project.date = (tempDate.getMonth() + 1) + '/' + tempDate.getDate();

			project.name = element.name;

			projects.push(project);
		});

		res.render('projects', {title: 'Projects', projects: projects});
	}).on('timeout', function(ms){
  		console.log('Trello did not return BOARD projects response within ' + ms + ' ms');
	});
});

app.route('/upcoming').get(function(req,res) {
	rest.get('https://api.trello.com/1/board/' + BOARD + '/cards?key=' + APP_KEY + '&token=' + APP_TOKEN, {timeout:10000}).on('complete', function(data) {
		var projects = data.filter(function(element) { 
			return element.idList === TODO_LIST;
		});

		res.render('upcoming', {title: 'Upcoming Initiatives', projects: projects});
	}).on('timeout', function(ms){
		console.log('Trello did not return TODO_LIST projects')
	});
});