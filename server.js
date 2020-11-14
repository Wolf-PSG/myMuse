const { ApolloServer } = require('apollo-server');
const { sequelize } = require('./models');
const typeDefs = require('./graphql/typeDefs/typeDefs');
const resolvers = require('./graphql/resolvers/index');
const contextMiddleware = require('./util/contextMiddleware');

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: contextMiddleware,
});

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`);
    sequelize
        .authenticate()
        .then(() => console.log('connected to db'))
        .catch((err) => console.log(err));
});

