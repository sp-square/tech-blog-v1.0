// import express
const express = require('express');
// import connection to the database
const sequelize = require('./config/connection');

// require('./models'); // this line will no longer be needed after we bring in our models via the routes
// import our routes
const routes = require('./controllers');

// set up the Express app
const app = express();
const PORT = process.env.PORT || 3001;

// set up the middleware to parse requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// mount the routes
app.use(routes);

// connect to the database before starting the Express server
sequelize.sync().then(() => {
	app.listen(PORT, () => {
		console.log(`App listening on port ${PORT}`);
	});
});
