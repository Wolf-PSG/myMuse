const express = require('express');
const {graphqlHTTP} = require('express-graphql');
const graphql = require('graphql');

const QueryRoot = new graphql.GraphQLObjectType({
    name: 'Query',
    fields: () => ({
        hello: {
            type: graphql.GraphQLString,
            resolve: () => 'Hello world!',
        },
        parm: {
            type: graphql.GraphQLString,
            resolve: () => 'lol'
        }
    }),
});

const schema = new graphql.GraphQLSchema({ query: QueryRoot });

const app = express();
app.use(
    '/',
    graphqlHTTP({
        schema: schema,
        graphiql: true,
    })
);
app.listen(4000);
// const pool = new Pool({
//     user: 'dbuser',
//     host: 'database.server.com',
//     database: 'mydb',
//     password: 'secretpassword',
//     port: 3211,
// })
// pool.query('SELECT NOW()', (err, res) => {
//     console.log(err, res)
//     pool.end()
// })
// const client = new Client({
//     user: 'dbuser',
//     host: 'database.server.com',
//     database: 'mydb',
//     password: 'secretpassword',
//     port: 3211,
// })
// client.connect()
// client.query('SELECT NOW()', (err, res) => {
//     console.log(err, res)
//     client.end()
// })

// const port = 8000;

// const server = app.listen(port, () => {
//     console.log('listening to port 8000');
// });

// process.on('unhandledRejection', (err) => {
//     console.log('unhandled rejection! goodbye 👋');
//     console.log(err);

//     server.close(() => {
//         // closing server gracefully
//         process.exit(1);
//     });
// });
