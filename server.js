const { ApolloServer } = require('apollo-server');
const { sequelize } = require('./models');
const typeDefs = require('./graphql/typeDefs/typeDefs');
const resolvers = require('./graphql/resolvers/index');
const contextMiddleware = require('./util/contextMiddleware');

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: contextMiddleware,
    subscriptions: { path: '/' },
});
//TODO rework subs -- too complicated and over worked
server.listen().then(({ url, subscriptionsUrl }) => {
    console.log(`Server ready at ${url}`);
    // console.log(`Subs ready at ${sub}`);
    console.log(`Sub server at ${subscriptionsUrl}`);
    sequelize
        .authenticate()
        .then(() => console.log('connected to db'))
        .catch((err) => console.log(err));
});
