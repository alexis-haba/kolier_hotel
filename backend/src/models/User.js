const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,  // évite les espaces inutiles (ex: "alexis " ≠ "alexis")
    },
    password: { 
      type: String, 
      required: true,
      select: false, // exclut automatiquement le mot de passe des résultats (plus sécurisé)
    },
    role: { 
      type: String, 
      enum: ['admin', 'employee'], 
      default: 'employee',
    },
  },
  { timestamps: true } // ajoute createdAt et updatedAt
);

module.exports = mongoose.model('User', userSchema);
