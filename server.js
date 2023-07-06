const path = require('path');
// import express
const express = require('express');
// import express-session
const session = require('express-session');
// import SequelizeStore constructor
const SequelizeStore = require('connect-session-sequelize')(session.Store);
// import connection to the database
const sequelize = require('./config/connection');
// import express-handlebars
const exphbs = require('express-handlebars');
// set up handlebars object with custom helpers
const helpers = require('./utils/helpers');
const hbs = exphbs.create({ helpers });

// import our routes
const routes = require('./controllers');

// set up the Express app
const app = express();
const PORT = process.env.PORT || 3001;

// configure session object
const sess = {
	// secret is used to sign the cookies
	secret: process.env.SECRET,
	// cookie options
	cookie: {
		// cookie will expire after one hour, expressed in milliseconds
		maxAge: 60 * 60 * 1000, // 1hr in milliseconds
		// only store session cookies when the protocol used by client to connect to our server is HTTP
		httpOnly: true,
		// only store session cookies when the protocol used by client to connect to our server is HTTPS
		secure: false,
	},
	// resave session to store even if session is not modified during request-response cycle
	resave: false,
	// save uninitialized session to store (uninitialized means new but not modified)
	saveUninitialized: false,
	// set-up session store
	store: new SequelizeStore({
		// connect to our database to save sessions there
		db: sequelize,
	}),
};

// mount session middleware
app.use(session(sess));

// mount handlebars as the default template engine
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// set up the middleware to parse requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// mount static middleware
app.use(express.static(path.join(__dirname, 'public')));

// mount the routes
app.use(routes);

// connect to the database before starting the Express server
sequelize.sync().then(() => {
	app.listen(PORT, () => {
		console.log(`App listening on port ${PORT}`);
	});
});
