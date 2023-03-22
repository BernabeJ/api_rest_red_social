//Importar dependecias y modulos
const bcrypt = require("bcrypt");
const User = require("../models/user");

//Acciones de prueba
const pruebaUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde: controllers/user.js",
  });
};

//Registro de Usuarios
const register = (req, res) => {
  //Recoger datos de la peticion
  let params = req.body;

  //comprobar que me llegan bien
  if (!params.name || !params.email || !params.password || !params.nick) {
    return res.status(400).json({
      status: "error",
      message: "faltan datos por enviar",
    });
  }

  //Control de usuarios duplicados
  User.find({
    $or: [
      { email: params.email.toLowerCase() },
      { nick: params.email.toLowerCase() },
    ],
  }).exec(async (error, users) => {
    if (error)
      return res.status(500).json({
        status: "error",
        message: "error en la consulta de usuarios",
      });
    if (users && users.length >= 1) {
      return res.status(200).send({
        status: "succes",
        message: "El usuario ya existe",
      });
    }
    //Cifrar la contraseña
    let pwd = await bcrypt.hash(params.password, 10);
    params.password = pwd;

    //Crear objeto de usuario
    let userToSave = new User(params);

    //Guardar Usuario en BBDD
    userToSave.save((error, userStored) => {
      if (error || !userStored)
        return res.status(500).send({
          status: "error",
          message: "Error al guardar el Usuairo",
        });

      //Devolver resultado
      return res.status(200).json({
        status: "succes",
        message: "Usuario Registrado correctamente",
        user: userStored,
      });
    });
  });
};

//Exportar acciones
module.exports = {
  pruebaUser,
  register,
};
