const dotenv = require("dotenv");
const express = require("express");
const morgan = require("morgan");
const { ApolloServer } = require("apollo-server-express");

const combine = require("graphql-combine");
const path = require("path");
const dbDatasource = require("./db");
<%if eq (index .Params `userAuth`) "yes" %>const { authMiddleware } = require("./middleware/auth");<% end %>

dotenv.config();
const app = express();
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(authMiddleware);

const {typeDefs, resolvers} = combine({
  typeDefs: path.join(__dirname, "graphql/*.graphql"),
  resolvers: path.join(__dirname, "graphql/*_resolver.js")
});

const server = new ApolloServer({
  context: async ( {req} ) => {
    if(req.user){
      return { user: {id: req.user.id, email: req.user.email} };
    }
  },
  typeDefs,
  resolvers
});
server.applyMiddleware({ app });

const port = process.env.SERVER_PORT;
if (!port) {
  port = 3000;
}

const main = async () => {
  // remove this block for development, just for verifying DB
  try {
    await dbDatasource.authenticate();
    console.log("Connection has been established successfully.");
    await dbDatasource.sync( {alter: true} );
    console.log("Created or altered tables");
    const res = await dbDatasource.query("SELECT 1");
    console.log(`Query successful, returned ${res[0].length} rows.`);
  } catch (e) {
    console.error(e);
  }

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
};

main();

