// create instance of express Router
const router = require('express').Router();
// import models from 'models/index.js'
const { Comment, User, Post } = require('../../models');
// import helper function for authentication
const withAuth = require('../../utils/auth');

/***** CREATE *****/
// Route to create a new comment
// POST method with endpoint '/api/comments/'
// test with: {"text": "This is the text for a new comment", "postId": 18}
// Only authenticated users can comment on a post
router.post('/', withAuth, async (req, res) => {
	try {
		// create new comment
		const newComment = await Comment.create({
			text: req.body.text,
			postId: req.body.postId,
			userId: req.session.userId,
		});
		res.status(201).json(newComment); // 201 - Created
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

/***** READ *****/
// Route to retrieve all comments
// GET method with endpoint '/api/comments/'
router.get('/', async (req, res) => {
	try {
		// retrieve all existing comments from the database
		const comments = await Comment.findAll({
			include: [
				{ model: User, attributes: ['username'] },
				{ model: Post, include: { model: User, attributes: ['username'] } },
			],
		});
		res.status(200).json(comments); // 200 - OK
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

// Route to retrieve a single comment by id
// GET method with endpoint '/api/comments/:commentId'
router.get('/:commentId', async (req, res) => {
	try {
		// retrieve a single comment by primary key - the comment's id is passed via the endpoint parameter 'commentId'
		const comment = await Comment.findByPk(req.params.commentId, {
			include: [
				{ model: User, attributes: ['username'] },
				{ model: Post, include: { model: User, attributes: ['username'] } },
			],
		});
		res.status(200).json(comment); // 200 - OK
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

/***** UPDATE *****/
// Route to update a comment by id
// PUT method with endpoint '/api/comments/:commentId'
// test with: {"text": "This is the updated text for an existing comment"}
// Only authenticated users can update their own comments
router.put('/:commentId', withAuth, async (req, res) => {
	try {
		// pass in req.body to only update what's sent over by the client
		const updatedComment = await Comment.update(req.body, {
			where: {
				id: req.params.commentId,
				// comment must belong to user attempting to update it (userId will come from req.session)
				userId: req.session.userId,
			},
		});

		// if no comment was updated, let client know the request could not be completed
		if (!updatedComment[0])
			return res
				.status(406)
				.json({ message: 'This request cannot be completed.' }); // 406 - Not Acceptable

		res.status(202).json(updatedComment); // 202 - Accepted
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

/***** DELETE *****/
// Route to delete a comment by id
// DELETE method with endpoint '/api/comments/:commentId'
// Only authenticated users can delete their own comment
// TODO: ICEBOX => Admin can also delete a comment
router.delete('/:commentId', withAuth, async (req, res) => {
	try {
		const deletedComment = await Comment.destroy({
			where: {
				id: req.params.commentId,
				// verify that comment belongs to user attempting to delete it (userId will come from req.session)
				userId: req.session.userId,
			},
		});

		// if no comment was deleted, let client know the request could not be completed
		if (!deletedComment)
			return res
				.status(406)
				.json({ message: 'This request cannot be completed.' }); // 406 - Not Acceptable

		res.status(202).json(deletedComment); // 202 - Accepted
	} catch (error) {
		console.log(error);
		res.status(500).json(error); // 500 - Internal Server Error
	}
});

module.exports = router;
