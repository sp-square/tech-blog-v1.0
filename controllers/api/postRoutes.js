// create instance of express Router
const router = require('express').Router();
// import our db connection for the SQL literals
const sequelize = require('../../config/connection');
// import models from 'models/index.js'
const { Post, User, Comment } = require('../../models');
// import helper function for authentication
const withAuth = require('../../utils/auth');

/***** CREATE *****/
// Route to create a new post
// POST method with endpoint '/api/posts/'
// test with: {"title": "Test title for a new post", "text": "This is the text for the new post"}
// Only authenticated users can create a new post
router.post('/', withAuth, async (req, res) => {
	try {
		// create new post
		const newPost = await Post.create({
			title: req.body.title,
			text: req.body.text,
			userId: req.session.userId,
		});
		res.status(201).json(newPost); // 201 - Created
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

/***** READ - optional *****/
// Route to retrieve all posts
// GET method with endpoint '/api/posts/'
router.get('/', async (req, res) => {
	try {
		// retrieve all existing posts from the database
		const posts = await Post.findAll({
			include: [{ model: User, attributes: ['username'] }],
			attributes: {
				include: [
					// use plain SQL to get a count of the number of comments for each post
					[
						sequelize.literal(
							'(SELECT COUNT(*) FROM comment WHERE comment.postId = post.id)'
						),
						'commentsCount',
					],
				],
			},
		});
		res.status(200).json(posts); // 200 - OK
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

// Route to retrieve a single post by id
// GET method with endpoint '/api/posts/:postId'
router.get('/:postId', async (req, res) => {
	try {
		// retrieve a single post by primary key - the post's id is passed via the endpoint parameter 'postId'
		const post = await Post.findByPk(req.params.postId, {
			include: [
				{ model: User, attributes: ['username'] },
				{ model: Comment, include: { model: User, attributes: ['username'] } },
			],
			attributes: {
				include: [
					// use plain SQL to get a count of the number of comments for each post
					[
						sequelize.literal(
							'(SELECT COUNT(*) FROM comment WHERE comment.postId = post.id)'
						),
						'commentsCount',
					],
				],
			},
		});
		res.status(200).json(post); // 200 - OK
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

/***** UPDATE *****/
// Route to update a post by id
// PUT method with endpoint '/api/posts/:postId'
// test with any and all of: {"title": "Updated test title for a new post", "text": "This is the updated text for the new post"}
// Only authenticated users can update their own posts
router.put('/:postId', withAuth, async (req, res) => {
	try {
		// pass in req.body to only update what's sent over by the client
		const updatedPost = await Post.update(req.body, {
			where: {
				id: req.params.postId,
				// post must belong to user attempting to update it (userId will come from req.session)
				userId: req.session.userId,
			},
		});

		// if no post was updated, let client know the request could not be completed
		if (!updatedPost[0])
			return res
				.status(406)
				.json({ message: 'This request cannot be completed.' }); // 406 - Not Acceptable

		res.status(202).json(updatedPost); // 202 - Accepted
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

/***** DELETE *****/
// Route to delete a post by id
// DELETE method with endpoint '/api/posts/:postId'
// Only authenticated users can delete their own post
// TODO: ICEBOX => Admin can also delete a post
router.delete('/:postId', withAuth, async (req, res) => {
	try {
		const deletedPost = await Post.destroy({
			where: {
				id: req.params.postId,
				// verify that post belongs to user attempting to delete it (userId will come from req.session)
				userId: req.session.userId,
			},
		});

		// if no post was deleted, let client know the request could not be completed
		if (!deletedPost)
			return res
				.status(406)
				.json({ message: 'This request cannot be completed.' }); // 406 - Not Acceptable

		res.status(202).json(deletedPost); // 202 - Accepted
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

module.exports = router;
