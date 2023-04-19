//importa modelo
const Follow = require("../models/follow");
const User = require("../models/user");

//Importa dependencias

const mongoosePaginate = require("mongoose-pagination");

//Acciones de prueba
const pruebaFollow = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde: controllers/follow.js",
  });
};

//Accion de seguir
const save = (req, res) => {
  //Conseguir datos por body
  const params = req.body;

  //sacar id del usuario identificado
  const identity = req.user;

  //crear objeto con modelo follow
  let userToFollow = new Follow({
    user: identity.id,
    followed: params.followed,
  });

  //Guardar objeto en base de datos
  userToFollow.save((error, followStored) => {
    if (error || !followStored) {
      return res.status(500).send({
        status: "error",
        message: "No se ha podido seguir al usuario",
      });
    }
    return res.status(200).send({
      status: "succes",
      message: "Metodo dar follow",
      identity: req.user,
      follow: followStored,
    });
  });
};
//Accion de dejar de seguir
const unfollow = (req, res) => {
  //Recoger el id del usuario identificado
  const userId = req.user.id;

  //Recoger el id del usuario que quiero dejar de seguir
  const followedId = req.params.id;

  //Find de las coincidencias y hacer remove
  Follow.find({
    user: userId,
    followed: followedId,
  }).remove((error, followDeleted) => {
    if (error || !followDeleted) {
      return res.status(500).send({
        stauts: "error",
        message: "no has deajdo de seguir a nadie",
      });
    }

    return res.status(200).send({
      message: "Follow eliminado correctamente",
      status: "success",
    });
  });
};
//Listado de usuarios que estoy siguiendo
const following = (req, res) => {
  //Sacar el usuairo identificado
  let userId = req.user.id;

  //Comprobar si me llega el id por parametro en url
  if (req.params.id) {
    userId = req.params.id;
  }
  //Comprobar si me llega la pagina
  let page = 1;
  if (req.params.page) page = req.params.page;
  //Usuarios por pagina que quiero mostrar
  const itemsPerPage = 5;
  //FInd a follow, popular datos de los usuarios y paginar con mongoose paginate
  Follow.find({ user: userId })
    .populate("user followed", "-password -role -__v")
    .paginate(page, itemsPerPage, (error, follows, total) => {
      //Sacar un array de ids de usuarios que me siguen y que sigo

      return res.status(200).send({
        status: "succes",
        message: "Listado de usuarios que estoy siguiendo",
        follows,
        total,
        pages: Math.ceil(total / itemsPerPage),
      });
    });
};
//Listado de usuarios que nos siguen
const followers = (req, res) => {
  return res.status(200).send({
    status: "succes",
    message: "Listado de usuarios que me siguen",
  });
};
//Exportar acciones
module.exports = {
  pruebaFollow,
  save,
  unfollow,
  following,
  followers,
};
