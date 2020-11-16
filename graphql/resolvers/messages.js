const { User, Message } = require('../../models');
const {
    UserInputError,
    AuthenticationError,
    PubSub,
    withFilter
} = require('apollo-server');
const { Op } = require('sequelize');

const subscribers = [];
const onMessagesUpdates = (fn) => subscribers.push(fn);
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
        sendMessage: async (parent, { to, content }, { pubsub ,user }) => {
            try {
                if (!user) throw new AuthenticationError('Unathenticated!');
                console.log(user.username);
                console.log(to);
                const sender = await User.findOne({
                    where: { username: user.username },
                });
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

                const { friends } = sender;

                if (!friends.some((el) => el == to))
                    throw new UserInputError('This user is not your friend');

                const message = await Message.create({
                    from: user.username,
                    to,
                    content,
                });
                pubsub.publish('NEW_MESSAGE', { newMessage: message });
                return message;
            } catch (err) {
                console.error(err);
                throw err;
            }
        },
    },
    Subscription: {
        newMessage: {
            subscribe: withFilter(
                (_, __, { pubsub, user }) => {
                    if (!user) throw new AuthenticationError('Unauthenticated');
                    return pubsub.asyncIterator('NEW_MESSAGE');
                },
                ({ newMessage }, _, { user }) => {
                    if (
                        newMessage.from === user.username ||
                        newMessage.to === user.username
                    ) {
                        return true;
                    }

                    return false;
                }
            ),
        },
    },
};

module.exports = resolvers;
