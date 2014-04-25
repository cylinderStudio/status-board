status-board
============

Display Trello data in Panic Status Board with Node.js

status_board.js

var config = require('./creds/config');	// comment out if deploying to Heroku

/creds/config.js

`
// Trello key, token and values
module.exports.trello = {
	board: '00aa123456',
	app_key: '00bb123456',
	app_token: '00cc123456',
	member_allan: '00dd123456',
	member_greg: '00ee123456',
	member_steve: '00ff123456',
	doing_list: '00gg123456',
	done_list: '00hh123456',
	todo_list: '00ii123457'
}

module.exports.authenticate = {
	username: 'userName',
	password: 'passWord'
}
`
