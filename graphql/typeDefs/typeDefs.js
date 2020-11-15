const { gql } = require('apollo-server');

module.exports = gql`
    type User {
        username: String!
        email: String!
        createdAt: String!
        imageUrl: String!
        friends: [String]!
        friendRequests: [String]!
        token: String
    }
    type Message {
        uuid: String!
        content: String!
        from: String!
        to: String!
        createdAt: String!
    }

    type Query {
        getUsers: [User]!
        login(username: String!, password: String!): User!
        filterUsers(filter: String!): [User!]
        getMessages(from: String!): [Message]!
    }
    type Mutation {
        register(
            username: String!
            email: String!
            password: String!
            confirmPassword: String!
        ): User!

        sendMessage(to: String!, content: String!): Message!

        friendRequest(to: String!): User!

        acceptFriend(friendToAdd: String!): User!
    }
`;
