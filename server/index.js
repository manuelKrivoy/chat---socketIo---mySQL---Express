import express from "express";
import logger from "morgan";
import { Server } from "socket.io";
import { createServer } from "node:http";
import dotenv from "dotenv";

dotenv.config();
const port = process.env.PORT ; // Utiliza el puerto especificado por la variable de entorno o 3000 por defecto

import { connection } from "./config.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

let dbStatus = null;

async function createMessagesTable(connection) {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      content VARCHAR(256)
    )
  `;
  await connection.execute(createTableQuery);
  console.log("Tabla 'messages' creada o ya existente");
}

async function connectToDatabase() {
  try {
    if (!dbStatus) {
      dbStatus = await connection.promise(); // Utiliza el método 'promise' para obtener una versión de la conexión compatible con promesas
      console.log("Conexión a la base de datos exitosa");

      await createMessagesTable(dbStatus);
    }

    return dbStatus;
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
    throw error;
  }
}

io.on("connection", (socket) => {
  console.log("A user has connected!");

  socket.on("disconnect", () => {
    console.log("A user has disconnected");
  });

  socket.on("chat message", async (msg) => {
    try {
      io.emit("chat message", msg);

      const connection = await connectToDatabase();

      const insertMessageQuery = "INSERT INTO messages (content) VALUES (?)";
      await connection.execute(insertMessageQuery, [msg]);
      console.log("Message saved:", msg);
    } catch (error) {
      console.error("Error al insertar el mensaje en la base de datos:", error);
    }
  });
});

app.use(logger("dev"));
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(port, () => {
  console.log("Server running on PORT:", port);
});
