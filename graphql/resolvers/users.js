const { User, sequelize } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserInputError, AuthenticationError } = require('apollo-server');
const { Op } = require('sequelize');
const { JWT_SECRET } = require('../../config/env.json');
const resolvers = {
    Query: {
        getUsers: async (_, __, { user }) => {
            try {
                if (!user) throw new AuthenticationError('Unauthenticated!');
                const users = await User.findAll({
                    where: { username: { [Op.ne]: user.username } },
                });
                return users;
            } catch (err) {
                throw err;
            }
        },
        getSingleUser: async (_, __, { user }) => {
            try {
                if (!user) throw new AuthenticationError('Unauthenticated!');
                const foundUser = await User.findOne({
                    where: { username: user.username },
                });
                if (!Array.isArray(foundUser.friends)) {
                    foundUser.friends = [];
                }
                if (!Array.isArray(foundUser.friendRequests)) {
                    foundUser.friendRequests = [];
                }
                return foundUser;
            } catch (err) {
                throw err;
            }
        },
        filterUsers: async (_, { filter }, { user }) => {
            try {
                if (!user) throw new AuthenticationError('Unauthenticated!');

                const users = await User.findAll({
                    limit: 10,
                    where: { username: { [Op.iLike]: `%${filter}%` } },
                });
                return users;
            } catch (err) {
                throw err;
            }
        },
        login: async (_, args) => {
            const { username, password } = args;
            let errors = {};
            try {
                if (username.trim() === '')
                    errors.username = 'username must not be empty';
                if (password === '')
                    errors.password = 'password must not be empty';

                if (Object.keys(errors).length > 0) {
                    throw new UserInputError('Bad input', { errors });
                }
                const user = await User.findOne({
                    where: { username },
                });

                if (!user) {
                    errors.username = 'user not found ';
                    throw new UserInputError('User not found', { errors });
                }

                const { friends, friendRequests, imageUrl } = user;

                const correctPassword = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!correctPassword) {
                    errors.password = 'Password does not match';
                    throw new AuthenticationError('Password is incorrect', {
                        errors,
                    });
                }

                const token = jwt.sign({ username }, JWT_SECRET, {
                    expiresIn: '90d',
                });

                return {
                    ...user.toJSON(),
                    createdAt: user.createdAt.toISOString(),
                    token,
                };
            } catch (err) {
                throw err;
            }
        },
    },
    Mutation: {
        register: async (_, args) => {
            let { username, email, password, confirmPassword } = args;
            let errors = {};
            try {
                if (email.trim() === '')
                    errors.email = 'email must not be empty';
                if (username.trim() === '')
                    errors.username = 'username must not be empty';
                if (password.trim() === '')
                    errors.password = 'password must not be empty';
                if (confirmPassword.trim() === '')
                    errors.confirmPassword =
                        'repeat password must not be empty';

                if (password !== confirmPassword)
                    errors.confirmPassword = 'passwords must match';
                if (Object.keys(errors).length > 0) {
                    throw errors;
                }

                password = await bcrypt.hash(password, 6);
                const newUser = await User.create({
                    username,
                    email,
                    password,
                });

                return newUser;
            } catch (err) {
                if (err.name === 'SequelizeUniqueConstraintError') {
                    err.errors.forEach(
                        (e) => (errors[e.path] = `${e.path} is already taken`)
                    );
                } else if (err.name === 'SequelizeValidationError') {
                    err.errors.forEach((e) => (errors[e.path] = e.message));
                }
                throw new UserInputError('Bad input', { errors });
            }
        },
        friendRequest: async (parent, { to }, { user }) => {
            //TODO check if the friend is already in friend lists
            try {
                if (!user) throw new AuthenticationError('Unauthenticated');

                if (user.username === to) {
                    throw new UserInputError(
                        'You cannot add yourself as a friend'
                    );
                }
                const requestingUser = await User.findOne({
                    where: { username: user.username },
                });

                const requestedFriend = await User.findOne({
                    where: { username: to },
                });

                if (!requestedFriend)
                    throw new UserInputError('User not found');

                const { friendRequests } = requestedFriend;
                const { friends } = requestingUser;

                if (Array.isArray(friends)) {
                    if (friends.length) {
                        const existingFriend = friends.some((el) => el === to);

                        if (existingFriend)
                            throw new UserInputError(
                                'This user is already your friend'
                            );
                    }
                    throw new Error('Not an Array - server Error');
                }
                if (Array.isArray(friendRequests)) {
                    if (friendRequests.length) {
                        const existingRequest = friendRequests.some(
                            (el) => el === user.username
                        );

                        if (existingRequest)
                            throw new UserInputError(
                                "You've already sent a friend request to this user "
                            );
                    }
                }

                User.update(
                    {
                        friendRequests: sequelize.fn(
                            'array_append',
                            sequelize.col('friendRequests'),
                            user.username
                        ),
                    },
                    { where: { username: requestedFriend.username } }
                );

                return requestedFriend;
            } catch (err) {
                throw err;
            }
        },

        acceptFriend: async (parent, { friendToAdd }, { user }) => {
            try {
                if (!user) throw new AuthenticationError('Unauthenticated');

                const acceptingUser = await User.findOne({
                    where: { username: user.username },
                });

                const { friends, friendRequests } = acceptingUser;
                if (Array.isArray(friends)) {
                    if (friends.length) {
                        if (friends.some((el) => el == friendToAdd))
                            throw new UserInputError(
                                'This user is already your friend'
                            );
                    }
                }

                if (Array.isArray(friendRequests)) {
                    if (!friendRequests.some((el) => el == friendToAdd)) {
                        throw new UserInputError(
                            'This user has not requested friendship'
                        );
                    }
                }

                User.update(
                    {
                        friends: sequelize.fn(
                            'array_append',
                            sequelize.col('friends'),
                            friendToAdd
                        ),
                    },
                    { where: { username: user.username } }
                );
                User.update(
                    {
                        friendRequests: sequelize.fn(
                            'array_remove',
                            sequelize.col('friendRequests'),
                            friendToAdd
                        ),
                    },
                    { where: { username: user.username } }
                );
                User.update(
                    {
                        friends: sequelize.fn(
                            'array_append',
                            sequelize.col('friends'),
                            user.username
                        ),
                    },
                    { where: { username: friendToAdd } }
                );
                return user;
            } catch (err) {
                throw err;
            }
        },
    },
};

module.exports = resolvers;
