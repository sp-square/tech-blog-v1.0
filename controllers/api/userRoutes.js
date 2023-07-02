const router = require('express').Router();
// import our db connection for the SQL literals
const sequelize = require('../../config/connection');
const { User, Post, Comment } = require('../../models');
const withAuth = require('../../utils/auth');

/***** CREATE *****/
// Route to sign up a new user
// POST method with endpoint '/api/users/'
// test with: {"username": "testUser", "email": "testUser@email.com", "password": "Password123"}
router.post('/', async (req, res) => {
	try {
		const newUser = await User.create({
			username: req.body.username,
			email: req.body.email,
			password: req.body.password,
		});

		// save new session to db
		req.session.save(() => {
			// create session variables based on the newly signed up user
			(req.session.userId = newUser.id), (req.session.loggedIn = true);
			res.status(201).json(newUser); // 201 - Created
		});
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

/***** READ - optional *****/
// Route to retrieve all users
// GET method with endpoint '/api/users/'
// TODO: ICEBOX - Admin routes
router.get('/', async (req, res) => {
	try {
		const users = await User.findAll({
			attributes: {
				exclude: ['password'],
				include: [
					// Use plain SQL to get a count of the number of posts made by a user
					[
						sequelize.literal(
							'(SELECT COUNT(*) FROM post WHERE post.userId = user.id)'
						),
						'postsCount',
					],
					// Use plain SQL to get a count of the number of comments made by a user
					[
						sequelize.literal(
							'(SELECT COUNT(*) FROM comment WHERE comment.userId = user.id)'
						),
						'commentsCount',
					],
				],
			},
		});
		res.status(200).json(users); // 200 - OK
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

// Route to retrieve logged in user's profile
// GET method with endpoint '/api/users/profile'
router.get('/profile', withAuth, async (req, res) => {
	try {
		const user = await User.findByPk(req.session.userId, {
			include: [
				{ model: Post },
				{ model: Comment, include: { model: Post, attributes: ['title'] } },
			],
			attributes: {
				exclude: ['password'],
				include: [
					// Use plain SQL to get a count of the number of posts made by a user
					[
						sequelize.literal(
							'(SELECT COUNT(*) FROM post WHERE post.userId = user.id)'
						),
						'postsCount',
					],
					// Use plain SQL to get a count of the number of comments made by a user
					[
						sequelize.literal(
							'(SELECT COUNT(*) FROM comment WHERE comment.userId = user.id)'
						),
						'commentsCount',
					],
				],
			},
		});

		if (!user) return res.status(404).json({ message: 'No user found.' }); // 404 - Not Found

		res.status(200).json(user); // 200 - OK
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

// Route to retrieve a single user by id
// GET method with endpoint '/api/users/:userId'
// TODO: ICEBOX - Admin routes
router.get('/:userId', async (req, res) => {
	try {
		const user = await User.findByPk(req.params.userId, {
			include: [
				{ model: Post },
				{ model: Comment, include: { model: Post, attributes: ['title'] } },
			],
			attributes: {
				exclude: ['password'],
				include: [
					// Use plain SQL to get a count of the number of posts made by a user
					[
						sequelize.literal(
							'(SELECT COUNT(*) FROM post WHERE post.userId = user.id)'
						),
						'postsCount',
					],
					// Use plain SQL to get a count of the number of comments made by a user
					[
						sequelize.literal(
							'(SELECT COUNT(*) FROM comment WHERE comment.userId = user.id)'
						),
						'commentsCount',
					],
				],
			},
		});

		if (!user) return res.status(404).json({ message: 'No user found.' }); // 404 - Not Found

		res.status(200).json(user); // 200 - OK
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

/***** UPDATE - optional *****/
// Route to update a user by id
// PUT method with endpoint '/api/users/profile'
// test with any and all of: {"username": "updatedTestUser", "email": "updatedTestUser@email.com", "password": "updatedPassword123"}
router.put('/profile', withAuth, async (req, res) => {
	try {
		// Pass in req.body to only update what's sent over by the client
		const updatedUser = await User.update(req.body, {
			where: {
				id: req.session.userId,
			},
			individualHooks: true,
		});

		if (!updatedUser[0])
			return res.status(404).json({ message: 'No user found.' }); // 404 - Not Found

		res.status(202).json(updatedUser); // 202 - Accepted
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

/***** DELETE - optional *****/
// Route to delete a user by id
// DELETE method with endpoint '/api/users/profile'
router.delete('/profile', withAuth, async (req, res) => {
	try {
		const deletedUser = await User.destroy({
			where: {
				id: req.session.userId,
			},
		});

		if (!deletedUser)
			return res.status(404).json({ message: 'No user found.' }); // 404 - Not Found

		res.status(202).json(deletedUser); // 202 - Accepted
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

// Route to delete a user by id
// DELETE method with endpoint '/api/users/:userId'
// TODO: ICEBOX => Admin routes
router.delete('/:userId', async (req, res) => {
	try {
		const deletedUser = await User.destroy({
			where: {
				id: req.params.userId,
			},
		});
		console.log(deletedUser);

		if (!deletedUser)
			return res.status(404).json({ message: 'No user found.' }); // 404 - Not Found

		res.status(202).json(deletedUser); // 202 - Accepted
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

/***** LOGIN *****/
// Route to login an existing user
// POST method with endpoint '/api/users/login'
// expects {"email": "ascoullar0@feedburner.com", "password": "rO1(*`VV,"}
router.post('/login', async (req, res) => {
	try {
		const user = await User.findOne({
			where: { email: req.body.email },
		});

		if (!user)
			return res.status(400).json({ message: 'Credentials not valid.' }); // 400 - Bad Request

		const validPw = await user.checkPassword(req.body.password);
		if (!validPw)
			return res.status(400).json({ message: 'Credentials not valid.' }); // 400 - Bad Request

		req.session.save(() => {
			// create session variables based on the logged in user
			req.session.userId = user.id;
			req.session.loggedIn = true;
			res.status(200).json(user); // 200 - OK
		});
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

/***** LOGOUT *****/
// Route to logout an existing user
// POST method with endpoint '/api/users/logout'
router.post('/logout', async (req, res) => {
	if (req.session.loggedIn) {
		req.session.destroy(() => {
			res.status(204).end();
		}); // 204 - No Content
	} else {
		res.status(404).end(); // 404 - Not Found
	}
});

module.exports = router;
