import { Pool } from "pg"; //Imports the Pool class, which manages multiple database connections. Using a pool is better than a single client because it allows multiple simultaneous queries.
import * as dotenv from "dotenv"; //Imports the dotenv library to handle environment variables.
dotenv.config();  //Loads variables from a .env file into process.env. This keeps sensitive information like database passwords out of your source code.

// The pool automatically picks up the connectionString from process.env**
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, //Tells the pool exactly where the database is located using a URL format
}); //Creates and exports a new connection manager.

export { pool };