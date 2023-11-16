import express from "express";
import logger from "morgan"; // Registra las solicitudes http que registra el servidor.
import { Server } from "socket.io";
import { createServer } from "node:http";
import dotenv from "dotenv";

dotenv.config();
const port = process.env.PORT;

import { connection } from "./config.js";

connection.connect((err) => {
  if (err) {
    console.error("Error al conectar a la base de datos: ", err);
    return;
  }
  console.log("Conexión a la base de datos exitosa");
  console.log(process.env.DATABASE_PORT);

  // Consulta para crear la tabla 'messages'
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        content VARCHAR(256)
      )
    `;

  connection.query(createTableQuery, (error, results) => {
    if (error) {
      console.error("Error al ejecutar la consulta:", error);
    }

    const app = express();
    const server = createServer(app); // Se necesita formatear a app como un servidor http formalmente para utilizarlo como parametro en io
    const io = new Server(server, {
      connectionStateRecovery: {}, //para no perder informacion, crea persistencia de datos, si un usuario se desconecta y luego se vuelve a conectar recibe los mensajes que deberia haber recibido estando desconectado.
    }); // Esto permite la comunicación en tiempo real entre el servidor y los clientes a través de WebSockets.

    io.on("connection", (socket) => {
      //IO SON TODAS LAS CONEXIONES, EL SOCKET UNA COMUNICACIÓN EN CONCRETO.
      console.log("A user has connected!");

      socket.on("disconnect", () => {
        console.log("a user has disconnected");
      });

      socket.on("chat message", (msg) => {
        io.emit("chat message", msg);
      });
    });

    app.use(logger("dev"));

    app.get("/", (req, res) => {
      res.sendFile(process.cwd() + "/client/index.html");
    });

    server.listen(port, () => {
      console.log("Server running on PORT: ", port);
    });

    connection.end();
  });
});
