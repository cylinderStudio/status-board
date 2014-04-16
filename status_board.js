var express = require('express');
var app = express();
var rest = require('restler');
var auth = require('http-auth');
var basic = auth.basic({
	realm: "Status Board",
	file: "creds/users.htpasswd"
});
var config = require('./creds/api_config');

//app.use(express.static(__dirname + '/images'));
// app.use(express.static(__dirname));
app.use(auth.connect(basic));

app.route('/projects').get(function (req,res) {
	rest.get('https://api.trello.com/1/board/' + config.trello.board + '/cards?key=' + config.trello.app_key + '&token=' + config.trello.app_token).on('complete', function(data) {
		var arr = data.filter(function(element) {
			return element.idList === config.trello.doing_list;
		});

		// HTML table begin
		var html_array = ['<table id="projects">\n'];

		// HTML table header
		html_array.push('<tr>\n' +
				'<th style="width: 750px;">Project</th>\n' +
				'<th style="width: 90px;">Due</th>\n' +
				'<th>Team</th>\n' +
				'<th>% Complete</th>\n' +
			'</tr>'
		);

		// HTML table body
		arr.forEach(function (element,index) {

			var html_persons_array = [],
				html_statusbars_array = [];

			// team members or 'persons'
			element.idMembers.forEach(function (element,index) {
				if (element === config.trello.member_allan || element === config.trello.member_greg || element === config.trello.member_steve) {
					html_persons_array.push('<img class="person" style="margin-left:4px;" src="' + element + '.png" />');
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
							'<td class="projectsBars">\n' +
								html_statusbars_array.join('') +
							'</td>\n' +
						'</tr>\n');
		});

		// HTML table end
		html_array.push('</table>');

		// serve to browser request
		res.send(html_array.join(''));
	});
});

app.route('/team').get(function (req,res) {
	var team_statuses = [];

	var getStatus = function(member_id,member_name,member_bio) {
		team_statuses.push({id: member_id, name: member_name, status: member_bio});

		if (team_statuses.length === 3) {
			// HTML table begin
			var html_array = ['<table id="projects">\n'];

			// HTML table header
			html_array.push('<tr>\n' +
					'<th style="width: 45px;"></th>\n' +
					'<th>Team Member</th>\n' +
					'<th>Status</th>\n' +
				'</tr>'
			);

			// HTML table body
			team_statuses.forEach(function(element ){
				html_array.push('<tr>\n' +
					'<td class="projectPersons"><img class="person" style="margin-left:4px;" src="' + element.id + '.png" /></td>\n' +
					'<td class="projectName">' + element.name + '</td>\n' +
					'<td class="projectVersion">' + element.status + '</td>\n' +
				'</tr>\n');
			});

			// HTML table end
			html_array.push('</table>');

			// serve to browser request
			res.send(html_array.join(''));
		}
	};

	rest.get('https://api.trello.com/1/members/' + config.trello.member_allan + '?key=' + config.trello.app_key + '&token=' + config.trello.app_token).on('complete', function(data){
		getStatus(data.id,data.fullName,data.bio);
	});

	rest.get('https://api.trello.com/1/members/' + config.trello.member_greg + '?key=' + config.trello.app_key + '&token=' + config.trello.app_token).on('complete', function(data){
		getStatus(data.id,data.fullName,data.bio);
	});

	rest.get('https://api.trello.com/1/members/' + config.trello.member_steve + '?key=' + config.trello.app_key + '&token=' + config.trello.app_token).on('complete', function(data){
		getStatus(data.id,data.fullName,data.bio);
	});
});

app.listen(8080);