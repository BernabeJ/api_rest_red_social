//Importar dependencias
const { connection } = require("./database/connection");
const express = require("express");
const cors = require("cors");

//Mensaje de Bienvenida
console.log("Api Node para red Social Arrancada");

//Conexion a BBDD
connection();

//Crear servidor Node
const app = express();
const port = 3900;

//Configurar CORS
app.use(cors());

//Convertir los datos del body a objetos js
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Cargar conf rutas
const userRoutes = require("./routes/user");
const publicationRoutes = require("./routes/publication");
const followRoutes = require("./routes/follow");

app.use("/api/user", userRoutes);
app.use("/api/publication", publicationRoutes);
app.use("/api/follow", followRoutes);

//ruta de prueba
app.get("/ruta-prueba", (req, res) => {
  return res.status(200).json({
    id: 1,
    nombre: "Bernabe",
    web: "bernabejimenezweb.es",
  });
});

//Poner servidor a escuchar peticiones http
app.listen(port, () => {
  console.log("Servidor de Node corriendo en el puerto: ", port);
});
