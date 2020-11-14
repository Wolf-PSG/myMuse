const { User, Message } = require('../../models');
const { UserInputError, AuthenticationError } = require('apollo-server');
const { Op } = require('sequelize');
const resolvers = {
    Query: {
        getMessages: async (parent, { from }, { user }) => {
            try {
                if (!user) throw new AuthenticationError('Unauthenticated');

                const otherUser = await User.findOne({
                    where: { username: from },
                });
                if (!otherUser) throw new UserInputError('User not found');

                const usernames = [user.username, otherUser.username];

                const messages = await Message.findAll({
                    where: {
                        from: { [Op.in]: usernames },
                        to: { [Op.in]: usernames },
                    },
                    order: [['createdAt', 'DESC']],
                });

                return messages;
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
    },
    Mutation: {
        sendMessage: async (parent, { to, content }, { user }) => {
            try {
                if (!user) throw new AuthenticationError('Unathenticated!');
                const recipient = await User.findOne({
                    where: { username: to },
                });
                if (!recipient) {
                    throw new UserInputError('User not found');
                } else if (recipient.username === user.username) {
                    throw new UserInputError('You cant message yourself');
                }
                if (content.trim() === '')
                    throw new UserInputError('No message found');

                const { friends } = user;

                if (!friends.some((el) => el == to))
                    throw new UserInputError('This user is not your friend');

                const message = await Message.create({
                    from: user.username,
                    to,
                    content,
                });
                return message;
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
    },
};

module.exports = resolvers;
