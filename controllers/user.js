//Importar dependecias y modulos
const bcrypt = require("bcrypt");
const User = require("../models/user");
//Importa servicios
const jwt = require("../services/jwt");

//Acciones de prueba
const pruebaUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde: controllers/user.js",
    usuario: req.user,
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

const login = (req, res) => {
  //Recoger parametros body
  let params = req.body;
  if (!params.email || !params.password) {
    return res.status(400).send({
      status: "error",
      message: "faltan datos por enviar",
    });
  }
  //Buscar en la bbdd si existe
  User.findOne({ email: params.email })
    //.select({ password: 0 })
    .exec((error, user) => {
      if (error || !user)
        return res.status(404).send({
          status: "error",
          message: "No existe el usuario",
        });
      //Comprobar su contaseña
      const pwd = bcrypt.compareSync(params.password, user.password);
      if (!pwd) {
        return res.status(400).send({
          status: "error",
          message: "No te has identificado correctamente",
        });
      }
      //Devolver Token
      const token = jwt.createToken(user);

      //Datos del Usuario

      return res.status(200).send({
        status: "succes",
        message: "Te has identificado correctamente",
        user: {
          id: user._id,
          name: user.name,
          nick: user.nick,
        },
        token,
      });
    });
};

//Exportar acciones
module.exports = {
  pruebaUser,
  register,
  login,
};
