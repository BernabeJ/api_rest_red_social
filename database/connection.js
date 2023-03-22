const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const connection = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/mi_redsocial");
    console.log(
      "Conectado correctamente con la base de datos de mi red social"
    );
  } catch (error) {
    console.log(error);
    throw new Error("No se ha podido conectar a la base de datos");
  }
};

module.exports = {
  connection,
};
