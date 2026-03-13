const mongoose = require("mongoose");
const { getMongoUri } = require("./mongoUri");

const connectDB = async () => {
  const uri = getMongoUri();
  if (!uri) {
    console.error("MONGO_URI non défini !");
    process.exit(1);
  }

  const hasPlaceholderCredentials =
    uri.includes("USER:") || uri.includes(":PASS@") || uri.includes("<password>");

  if (hasPlaceholderCredentials) {
    console.error(
      "MONGO_URI invalide: remplace USER/PASS par tes vrais identifiants MongoDB Atlas (mot de passe URL-encodé)."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      family: 4,
    });

    console.log("MongoDB Connected (SRV direct)");
  } catch (err) {
    console.error("Erreur MongoDB :", err.message);
    console.error("Détails :", err);
    process.exit(1);
  }
};

module.exports = connectDB;
