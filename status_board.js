// Node server requires . . . 
var express = require('express');
var app = express();
var rest = require('restler');
var auth = require('http-auth');
var config = require('./creds/config');
var stylus = require('stylus');

// constants for .gitignored local values or Heroku environment constants
var BOARD = process.env.BOARD || config.trello.board;
var APP_KEY = process.env.APP_KEY || config.trello.app_key;
var APP_TOKEN = process.env.APP_TOKEN || config.trello.app_token;
var MEMBER_ALLAN = process.env.MEMBER_ALLAN || config.trello.member_allan;
var MEMBER_GREG = process.env.MEMBER_GREG || config.trello.member_greg;
var MEMBER_STEVE = process.env.MEMBER_STEVE || config.trello.member_steve;

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

// Static path for images that get called from within the table markup
app.use('/images', express.static(__dirname + '/images'));
app.use('/stylesheet', express.static(__dirname + '/stylesheet'));

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
			return element.idList === config.trello.doing_list;
		});

		// HTML table begin
		var html_array = ['<table id="projects">\n'];

		// HTML table header
		html_array.push('<tr>\n' +
				'<th style="width: 960px;">Project</th>\n' +
				'<th style="width: 90px;">Due</th>\n' +
				'<th style="width: 120px;">Team</th>\n' +
				'<th>% Done</th>\n' +
			'</tr>'
		);

		// HTML table body
		arr.forEach(function(element,index) {

			var html_persons_array = [],
				html_statusbars_array = [];

			// team members or 'persons'
			element.idMembers.forEach(function(element,index) {
				if (element === MEMBER_ALLAN || element === MEMBER_GREG || element === MEMBER_STEVE) {
					html_persons_array.push('<img class="person" style="margin-left:4px;" src="/images/' + element + '.png" />');
				}
			});

			// status bars based on tasks completed
			if (element.badges.checkItems === 0) {
				html_statusbars_array.push('<div class="barSegment value1"></div>');
			} else {
				var barCount = Math.ceil((element.badges.checkItemsChecked / element.badges.checkItems) * 8);

				for (var i=1; i<barCount; i++) {
					html_statusbars_array.push('<div class="barSegment value' + i + '"></div>\n');
				}
			}

			// project due date
			var tempDate = new Date(element.due);
			var displayDate = (tempDate.getMonth() + 1) + '/' + tempDate.getDate();

			html_array.push('<tr>\n' +
							'<td class="projectName">' + element.name + '</td>\n' +
							'<td class="projectVersion">' + displayDate + '</td>\n' +
							'<td class="projectPersons">' + html_persons_array.join('') +
							'</td>\n' +
							'<td class="projectsBars">' +
								html_statusbars_array.join('') +
							'</td>\n' +
						'</tr>\n');
		});

		// HTML table end
		html_array.push('</table>');

		// serve to browser request
		res.send(html_array.join(''));
	}).on('timeout', function(ms){
  		console.log('Trello did not return BOARD projects response within ' + ms + ' ms');
	});

app.route('/goals').get(function(req,res) {
	rest.get('').on('complete', function(data) {

	});
});

});