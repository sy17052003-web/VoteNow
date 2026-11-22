function chargerDonnees() {
    let donnees = localStorage.getItem('donnees_election');
    if (!donnees) {
        donnees = {
            candidats: [
                { id: 1, nom: 'Ibrahima Tine', slogan: 'Pour l\'égalité et la justice' },
                { id: 2, nom: 'Madina Ba', slogan: 'L\'innovation avant tout' },
                { id: 3, nom: 'Seydou Diop', slogan: 'Ensemble pour la prosperité' }
            ],
            votes: [],
            votants: []
        };
        localStorage.setItem('donnees_election', JSON.stringify(donnees));
    } else {
        donnees = JSON.parse(donnees);
    }
    return donnees;
}

function sauvegarderDonnees(donnees) {
    localStorage.setItem('donnees_election', JSON.stringify(donnees));
}

function switchTab(nomOnglet) {
    const onglets = document.querySelectorAll('.contenu_onglet');
    const boutons = document.querySelectorAll('.bouton_de_navigation');

    onglets.forEach(onglet => onglet.classList.remove('actif'));
    boutons.forEach(btn => btn.classList.remove('actif'));

    document.getElementById(nomOnglet).classList.add('actif');
    document.querySelector(`[data-tab="${nomOnglet}"]`).classList.add('actif');

    if (nomOnglet === 'resultats') {
        actualiserResultats();
    }
}

document.querySelectorAll('.bouton_de_navigation').forEach(bouton => {
    bouton.addEventListener('click', () => {
        switchTab(bouton.getAttribute('data-tab'));
    });
});

function initialiserFormulaireVote() {
    const donnees = chargerDonnees();
    const conteneur = document.getElementById('liste_candidats');
    conteneur.innerHTML = '';

    donnees.candidats.forEach(candidat => {
        const carte = document.createElement('div');
        carte.className = 'carte_candidat';
        carte.id = `candidat_${candidat.id}`;
        carte.innerHTML = `
            <input type="radio" name="candidat_choisi" value="${candidat.id}" onchange="marquerCandidatChoisi(${candidat.id})">
            <p class="nom_candidat">${candidat.nom}</p>
            <p class="slogan_candidat">"${candidat.slogan}"</p>
        `;
        conteneur.appendChild(carte);
    });
}

function marquerCandidatChoisi(idCandidat) {
    const cartes = document.querySelectorAll('.carte_candidat');
    cartes.forEach(carte => carte.classList.remove('selectionnee'));

    const carteChoisie = document.getElementById(`candidat_${idCandidat}`);
    if (carteChoisie) {
        carteChoisie.classList.add('selectionnee');
    }
}

function submitVote() {
    const identifiant = document.getElementById('identifiant_votant').value.trim();
    const choixVote = document.querySelector('input[name="candidat_choisi"]:checked');

    if (!identifiant) {
        afficherMessage('message_vote', 'Veuillez entrer votre identifiant', 'error');
        return;
    }

    const regexHuitChiffres = /^\d{8}$/;
    if (!regexHuitChiffres.test(identifiant)) {
        afficherMessage('message_vote', 'L\'identifiant doit être un nombre de 8 chiffres (entre 10000000 et 99999999).', 'error');
        return;
    }

    if (!choixVote) {
        afficherMessage('message_vote', 'Veuillez sélectionner un candidat', 'error');
        return;
    }

    const donnees = chargerDonnees();

    if (donnees.votants.includes(identifiant)) {
        afficherMessage('message_vote', 'Vous avez déjà voté avec cet identifiant !', 'error');
        return;
    }

    const idCandidatChoisi = parseInt(choixVote.value);
    donnees.votes.push(idCandidatChoisi);
    donnees.votants.push(identifiant);
    sauvegarderDonnees(donnees);

    afficherMessage('message_vote', '✓ Votre vote a été enregistré avec succès !', 'success');
    resetVoteForm();
    setTimeout(() => {
        document.getElementById('message_vote').classList.add('cachee');
    }, 3000);
}

function resetVoteForm() {
    document.getElementById('identifiant_votant').value = '';
    document.querySelectorAll('input[name="candidat_choisi"]').forEach(input => input.checked = false);
    document.querySelectorAll('.carte_candidat').forEach(carte => carte.classList.remove('selectionnee'));
}

function actualiserResultats() {
    const donnees = chargerDonnees();
    const resultsBody = document.getElementById('corps_tableau_resultats');
    const graphiquesContainer = document.getElementById('graphiques_resultats');
    const sectionGagnant = document.getElementById('section_gagnant');

    resultsBody.innerHTML = '';
    graphiquesContainer.innerHTML = '';

    if (donnees.votes.length === 0) {
        resultsBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #5F6368;">Aucun vote enregistré pour le moment.</td></tr>';
        sectionGagnant.classList.add('cachee');
        return;
    }

    const comptage = {};
    donnees.candidats.forEach(candidat => {
        comptage[candidat.id] = 0;
    });

    donnees.votes.forEach(idCandidat => {
        if (comptage.hasOwnProperty(idCandidat)) {
            comptage[idCandidat]++;
        }
    });

    let totalVotes = donnees.votes.length;
    let idGagnant = null;
    let maxVotes = 0;

    donnees.candidats.forEach(candidat => {
        const nombreVoix = comptage[candidat.id];
        const pourcentage = ((nombreVoix / totalVotes) * 100).toFixed(1);

        const ligne = document.createElement('tr');
        ligne.innerHTML = `
            <td><strong>${candidat.nom}</strong></td>
            <td>${nombreVoix}</td>
            <td>${pourcentage}%</td>
        `;
        resultsBody.appendChild(ligne);

        if (nombreVoix > maxVotes) {
            maxVotes = nombreVoix;
            idGagnant = candidat.id;
        }
    });

    donnees.candidats.forEach(candidat => {
        const nombreVoix = comptage[candidat.id];
        const pourcentage = ((nombreVoix / totalVotes) * 100).toFixed(1);
        const largeur = totalVotes > 0 ? (nombreVoix / totalVotes) * 100 : 0;

        const element = document.createElement('div');
        element.className = 'element_graphique';
        element.innerHTML = `
            <div class="etiquette_graphique">
                <span class="nom_candidat">${candidat.nom}</span>
                <span class="nombre_voix">${nombreVoix} voix</span>
            </div>
            <div class="barre_progression">
                <div class="remplissage_barre" style="width: ${largeur}%">
                    ${largeur > 10 ? pourcentage + '%' : ''}
                </div>
            </div>
        `;
        graphiquesContainer.appendChild(element);
    });

    if (idGagnant !== null) {
        const candidatGagnant = donnees.candidats.find(c => c.id === idGagnant);
        document.getElementById('nom_gagnant').textContent = candidatGagnant.nom;
        document.getElementById('voix_gagnant').textContent = `${maxVotes} voix - ${((maxVotes / totalVotes) * 100).toFixed(1)}%`;
        sectionGagnant.classList.remove('cachee');
    }
}

function refreshResults() {
    actualiserResultats();
    afficherMessage('message_resultats', 'Résultats mis à jour', 'success');
}

function afficherMessage(idElement, texte, type) {
    const element = document.getElementById(idElement);
    if (!element) return;

    element.textContent = texte;
    element.className = `message ${type}`;
    element.classList.remove('cachee');
}

function cacherMessage(idElement) {
    const element = document.getElementById(idElement);
    if (element) {
        element.classList.add('cachee');
    }
}

const MOT_DE_PASSE_ADMIN = 'admin123';

function toggleAdminPanel() {
    if (isAdminLoggedIn()) {
        logoutAdmin();
    } else {
        openAdminPanel();
    }
}

function openAdminPanel() {
    document.getElementById('modale_connexion_administration').classList.remove('cachee');
}

function closeAdminPanel() {
    document.getElementById('modale_connexion_administration').classList.add('cachee');
    document.getElementById('mot_de_passe_administration').value = '';
    cacherMessage('message_connexion_administration');
}

function authenticateAdmin() {
    const motDePasse = document.getElementById('mot_de_passe_administration').value;

    if (motDePasse === MOT_DE_PASSE_ADMIN) {
        sessionStorage.setItem('administration_connectee', 'true');
        mettreAJourEtatAdmin();
        closeAdminPanel();
        afficherMessage('message_administration', '✓ Connexion réussie', 'success');
    } else {
        afficherMessage('message_connexion_administration', 'Mot de passe incorrect', 'error');
    }
}

function handleAdminPasswordKeyPress(event) {
    if (event.key === 'Enter') {
        authenticateAdmin();
    }
}

function isAdminLoggedIn() {
    return sessionStorage.getItem('administration_connectee') === 'true';
}

function logoutAdmin() {
    afficherModalConfirmation(
        'Déconnexion',
        'Êtes-vous sûr de vouloir vous déconnecter ?',
        () => {
            sessionStorage.removeItem('administration_connectee');
            mettreAJourEtatAdmin();
            actualiserInterfaceAdmin();
            afficherMessage('message_administration', 'Vous avez été déconnecté', 'success');
        }
    );
}

function mettreAJourEtatAdmin() {
    const texteEtat = document.getElementById('texte_etat_connexion');
    const boutonBasculer = document.getElementById('bouton_administration_basculer');

    if (isAdminLoggedIn()) {
        texteEtat.textContent = 'Connecté';
        texteEtat.classList.add('connecte');
        boutonBasculer.textContent = '🚪 Déconnexion';
    } else {
        texteEtat.textContent = 'Non connecté';
        texteEtat.classList.remove('connecte');
        boutonBasculer.textContent = '🔐 Admin';
    }

    if (isAdminLoggedIn()) {
        closeAdminPanel();
    }

    actualiserInterfaceAdmin();
}

function actualiserInterfaceAdmin() {
    const estConnecte = isAdminLoggedIn();
    const sectionNonConnectee = document.getElementById('administration_non_connectee');
    const sectionConnectee = document.getElementById('administration_connectee');
    const sectionAjoutCandidat = document.getElementById('section_ajout_candidat');

    if (estConnecte) {
        sectionNonConnectee.classList.add('cachee');
        sectionConnectee.classList.remove('cachee');
        sectionAjoutCandidat.classList.remove('cachee');
        afficherCandidatsAdmin();
    } else {
        sectionNonConnectee.classList.remove('cachee');
        sectionConnectee.classList.add('cachee');
        sectionAjoutCandidat.classList.add('cachee');
    }
}

function afficherListeCandidatsAdmin() {
    const donnees = chargerDonnees();
    const conteneur = document.getElementById('liste_candidats_administration');
    conteneur.innerHTML = '';

    donnees.candidats.forEach(candidat => {
        const element = document.createElement('div');
        element.className = 'element_candidat_administration';
        element.innerHTML = `
            <div class="information_candidat">
                <h4>${candidat.nom}</h4>
                <p>"${candidat.slogan}"</p>
            </div>
            <button class="bouton_supprimer" onclick="supprimerCandidat(${candidat.id})" title="Supprimer">✕</button>
        `;
        conteneur.appendChild(element);
    });
}

function addCandidate() {
    if (!isAdminLoggedIn()) {
        afficherMessage('message_administration', 'Vous devez être connecté pour ajouter un candidat', 'error');
        return;
    }

    const nom = document.getElementById('champ_nom_candidat').value.trim();
    const slogan = document.getElementById('champ_slogan_candidat').value.trim();

    if (!nom || !slogan) {
        afficherMessage('message_administration', 'Veuillez remplir tous les champs', 'error');
        return;
    }

    const donnees = chargerDonnees();
    const nouvelId = Math.max(...donnees.candidats.map(c => c.id), 0) + 1;

    donnees.candidats.push({
        id: nouvelId,
        nom: nom,
        slogan: slogan
    });

    sauvegarderDonnees(donnees);
    afficherMessage('message_administration', '✓ Candidat ajouté avec succès', 'success');
    document.getElementById('champ_nom_candidat').value = '';
    document.getElementById('champ_slogan_candidat').value = '';
    afficherListeCandidatsAdmin();
    initialiserFormulaireVote();

    setTimeout(() => {
        document.getElementById('message_administration').classList.add('cachee');
    }, 2000);
}

function supprimerCandidat(idCandidat) {
    afficherModalConfirmation(
        'Supprimer le candidat',
        'Êtes-vous sûr de vouloir supprimer ce candidat ? Cette action ne peut pas être annulée.',
        () => {
            const donnees = chargerDonnees();
            donnees.candidats = donnees.candidats.filter(c => c.id !== idCandidat);
            donnees.votes = donnees.votes.filter(v => v !== idCandidat);
            sauvegarderDonnees(donnees);
            afficherMessage('message_administration', '✓ Candidat supprimé', 'success');
            afficherListeCandidatsAdmin();
            initialiserFormulaireVote();
        }
    );
}

function resetAllData() {
    if (!isAdminLoggedIn()) {
        afficherMessage('message_administration', 'Vous devez être connecté', 'error');
        return;
    }

    afficherModalConfirmation(
        'Réinitialiser les votes',
        'Attention ! Cela supprimera TOUS les votes. Cette action ne peut pas être annulée.',
        () => {
            const donnees = chargerDonnees();
            donnees.votes = [];
            donnees.votants = [];
            sauvegarderDonnees(donnees);
            afficherMessage('message_administration', '✓ Tous les votes ont été réinitialisés', 'success');
            actualiserResultats();
        }
    );
}

let callbackConfirmation = null;

function afficherModalConfirmation(titre, message, callback) {
    document.getElementById('titre_modale_confirmation').textContent = titre;
    document.getElementById('corps_modale_confirmation').textContent = message;
    callbackConfirmation = callback;
    document.getElementById('modale_confirmation_generique').classList.remove('cachee');
}

function closeConfirmModal() {
    document.getElementById('modale_confirmation_generique').classList.add('cachee');
    callbackConfirmation = null;
}

document.getElementById('bouton_action_modale_confirmation')?.addEventListener('click', () => {
    if (callbackConfirmation) {
        callbackConfirmation();
    }
    closeConfirmModal();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (!document.getElementById('modale_confirmation_generique').classList.contains('cachee')) {
            closeConfirmModal();
        }
        if (!document.getElementById('modale_connexion_administration').classList.contains('cachee')) {
            closeAdminPanel();
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initialiserFormulaireVote();
    mettreAJourEtatAdmin();
    actualiserInterfaceAdmin();
});