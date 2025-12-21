import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import "./ResidencesList.css";

export default function ResidencesList() {
  const [residences, setResidences] = useState([]);
  const navigate = useNavigate();

  // Récupération sécurisée de la résidence actuelle
  let savedResidence = null;
  try {
    savedResidence = JSON.parse(localStorage.getItem("currentResidence"));
  } catch (err) {
    console.warn("Erreur parsing currentResidence", err);
  }

  // Charger les résidences
  useEffect(() => {
    api.get("/residences")
      .then((res) => {
        const list = res.data || [];
        // Tri pour que la résidence mère soit en premier
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setResidences(list);
      })
      .catch((err) => console.error("Erreur récupération résidences:", err));
  }, []);

  // Aller directement au dashboard (résidence actuelle)
  const continueToDashboard = () => navigate("/");

  // Aller à la page login de n'importe quelle résidence
  const openResidenceLogin = (residence) => {
    if (!residence?.link) {
      console.warn("Aucun lien défini pour cette résidence");
      return;
    }
    localStorage.setItem("currentResidence", JSON.stringify(residence));
    window.location.href = residence.link;
  };

  return (
    <div className="residence-page">

      {/* Bouton continuer si on a déjà choisi une résidence */}
      {savedResidence && (
        <button className="continue-btn" onClick={continueToDashboard}>
          Continuer avec la résidence actuelle
        </button>
      )}

      <h2 className="title">Sélectionnez une résidence</h2>

      {/* Message si aucune résidence */}
      {residences.length === 0 ? (
        <p className="no-residence">Aucune résidence disponible.</p>
      ) : (
        <div className="grid">
          {residences.map((r) => (
            <div
              key={r._id}
              className="card"
              onClick={() => openResidenceLogin(r)}
            >
              <img src="/logo.png" alt="logo résidence" className="logo-img" />
              <div className="name">{r.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
