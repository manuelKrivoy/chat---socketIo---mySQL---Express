import express from "express";
import logger from "morgan"; // Registra las solicitudes http que registra el servidor.
import { Server } from "socket.io";
import { createServer } from "node:http";
import dotenv from "dotenv";

dotenv.config();
const port = process.env.PORT;

import { connection } from "./config.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

// Manejamos errores al conectarnos a la base de datos
async function connectToDatabase() {
  try {
    await connection.connect();
    console.log("Conexión a la base de datos exitosa");

    // Creamos la tabla 'messages' si no existe
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        content VARCHAR(256)
      )
    `;
    await connection.execute(createTableQuery);
    console.log("Tabla 'messages' creada o ya existente");

    // Retornamos la conexión
    return connection;
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
    throw error;
  }
}

// Manejamos los eventos de conexión y desconexión de Socket.IO
io.on("connection", (socket) => {
  console.log("A user has connected!");

  socket.on("disconnect", () => {
    console.log("A user has disconnected");
  });

  socket.on("chat message", async (msg) => {
    try {
      io.emit("chat message", msg);

      // Conectamos a la base de datos
      const connection = await connectToDatabase();

      // Insertamos el mensaje en la base de datos
      const insertMessageQuery = "INSERT INTO messages (content) VALUES (?)";
      await connection.execute(insertMessageQuery, [msg]);
      console.log("Message saved:", msg);

      // Cerramos la conexión después de cada consulta
     // await connection.end();
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