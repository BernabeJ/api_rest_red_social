//Importar modulos
const jwt = require("jwt-simple");
const moment = require("moment");

//Importar clave secreta
const libjwt = require("../services/jwt");
const secret = libjwt.secret;

//Funcion de autenticacion
exports.auth = (req, res, next) => {
  //Comprobar si me llega la cabecera de autenticacion
  if (!req.headers.authorization) {
    return res.status(403).send({
      status: "error",
      message: "la peticion no tiene la cabecera de autenticacion",
    });
  }
  //Decodificar el token
  let token = req.headers.authorization.replace(/['"]+/g, "");

  try {
    let payload = jwt.decode(token, secret);

    //comprobar expiracion del token
    if (payload.exp <= moment().unix()) {
      return res.status(404).send({
        status: "error",
        message: "Token expirado",
      });
    }
    //Agreagar los datos del usuario a la request
    req.user = payload;
  } catch (error) {
    return res.status(404).send({
      status: "error",
      message: "Token invalido",
      error,
    });
  }

  //Pasar a ejecutar accion
  next();
};
