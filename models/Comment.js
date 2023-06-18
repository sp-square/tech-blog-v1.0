const { Model, DataTypes } = require('sequelize');
const connection = require('../config/connection');

class Comment extends Model {}

Comment.init(
	{
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true,
		},
		text: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		userId: {
			type: DataTypes.INTEGER,
			references: {
				model: 'user',
				key: 'id',
			},
		},
		postId: {
			type: DataTypes.INTEGER,
			references: {
				model: 'post',
				key: 'id',
			},
		},
	},
	{
		sequelize: connection,
		freezeTableName: true,
		modelName: 'comment',
	}
);

module.exports = Comment;
