//Importar dependecias y modulos
const bcrypt = require("bcrypt");
const mongoosePagination = require("mongoose-pagination");
const user = require("../models/user");
const fs = require("fs");
const path = require("path");
//Importar modelos
const User = require("../models/user");
//Importa servicios
const jwt = require("../services/jwt");
const { exists } = require("../models/user");

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

const profile = (req, res) => {
  //Recibir el parámetro del id del usuario por la url
  const id = req.params.id;

  //Consulta para sacar los datos del usuario
  User.findById(id)
    .select({ password: 0, role: 0 })
    .exec((error, userProfile) => {
      if (error || !userProfile) {
        return res.status(404).send({
          status: "error",
          message: "El usuario no existe o hay un error",
        });
      }
      //Posteriormente: devolver informacion de follows
      return res.status(200).send({
        status: "succes",
        user: userProfile,
      });
    });
  //Devolver resultado
};

const list = (req, res) => {
  //Controlar en que pagina estamos
  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }
  page = parseInt(page);

  //Consulta con mongoose paginate
  let itemsPerPage = 4;

  User.find()
    .sort("_id")
    .paginate(page, itemsPerPage, (error, users, total) => {
      //Devolver resultado(posteriormente info de follows)

      if (error || !users) {
        return res.status(404).send({
          status: "error",
          message: "No hay usuarios disponibles",
          page,
        });
      }
      return res.status(200).send({
        status: "succes",
        users,
        page,
        itemsPerPage,
        total,
        pages: Math.ceil(total / itemsPerPage),
      });
    });
};

const update = (req, res) => {
  //Recoger info de usuario a actualizar
  const userIdentity = req.user;
  let userToUpdate = req.body;

  //Eliminar campos sobrantes
  delete userToUpdate.iat;
  delete userToUpdate.exp;
  delete userToUpdate.role;
  delete userToUpdate.image;
  //Comprobar si el usuario ya existe
  User.find({
    $or: [
      { email: userToUpdate.email.toLowerCase() },
      { nick: userToUpdate.email.toLowerCase() },
    ],
  }).exec(async (error, users) => {
    if (error)
      return res.status(500).json({
        status: "error",
        message: "error en la consulta de usuarios",
      });

    let userIsset = false;
    users.forEach((user) => {
      if (user && user._id != userIdentity.id) userIsset = true;
    });

    if (userIsset) {
      return res.status(200).send({
        status: "succes",
        message: "El usuario ya existe",
      });
    }

    //Cifrar la contraseña
    if (userToUpdate.password) {
      let pwd = await bcrypt.hash(userToUpdate.password, 10);
      userToUpdate.password = pwd;
    }
    //Buscar y actualizar

    try {
      let userUpdated = await User.findByIdAndUpdate(
        { _id: userIdentity.id },
        userToUpdate,
        { new: true }
      );
      if (!userUpdated) {
        return res.status(400).json({
          status: "error",
          message: "Error al actualizar  usuario",
        });
      }

      //Devolver respuesta
      return res.status(200).send({
        status: "succes",
        message: "Metodo de actualizar usuario ",
        user: userUpdated,
      });
    } catch (error) {
      return res.status(500).send({
        status: "error",
        message: "Error al actualizar el usuario ",
      });
    }
  });
};

const upload = (req, res) => {
  //recoger el fichero de imagen y comprobar que existe
  if (!req.file) {
    return res.status(404).send({
      status: "error",
      message: "Peticion no incluye la imagen",
    });
  }

  //conseguir el nombre del archivo
  let image = req.file.originalname;
  //Sacar la extension del archivo
  const imageSplit = image.split(".");
  const extension = imageSplit[1];

  //Comprobar extension
  if (
    extension != "png" &&
    extension != "jpg" &&
    extension != "jpeg" &&
    extension != "gif"
  ) {
    //Borrrar archivo
    const filePath = req.file.path;
    const fileDeleted = fs.unlinkSync(filePath);
    return res.status(400).send({
      status: "error",
      message: "Extension del fichero no valida",
    });
  }

  //Si si es correcta, guardar imagen en bbdd
  User.findOneAndUpdate(
    { _id: req.user.id },
    { image: req.file.filename },
    { new: true },
    (error, userUpdate) => {
      if (error || !userUpdate) {
        return res.status(500).send({
          status: "error",
          message: "Error en la subida del avatar",
        });
      }
      return res.status(200).send({
        status: "success",
        user: userUpdate,
        file: req.file,
      });
    }
  );
};

const avatar = (req, res) => {
  //Sacar el parametro de la url
  const file = req.params.file;

  //Montar un path real de la imagen
  const filePath = "./uploads/avatars/" + file;
  console.log(filePath);

  //Comprobar que el archivo existe
  fs.stat(filePath, (error, exists) => {
    if (!exists) {
      return res.status(404).send({
        status: "error",
        message: "No existe la imagen",
      });
    }
    //Devolver un file

    return res.sendFile(path.resolve(filePath));
  });
};

//Exportar acciones
module.exports = {
  pruebaUser,
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar,
};
