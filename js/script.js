import config from "./config.js"; // Importation de la configuration contenant l'API key

// Sélection des éléments du DOM
const typingForm = document.querySelector(".typingForm"); // Formulaire de saisie de message
const chatList = document.querySelector(".chatList"); // Liste des messages
const suggestions = document.querySelectorAll(".suggestionList .suggestion")
const toggleThemeButton = document.querySelector("#toggleThemeButton"); // Bouton pour changer le thème
const deleteChatButton = document.querySelector("#deleteChatButton"); // Bouton pour supprimer les messages

let userMessage = null; // Variable pour stocker le message de l'utilisateur
let isResponseGenerating = false;

const API_KEY = config.apiKey; // Clé API pour accéder au service de Google Gemini
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`; // URL de l'API

// Fonction pour charger les données du localStorage
function loadLocalStorageData() {
	const savedChats = localStorage.getItem("savedChats"); // Récupération des messages sauvegardés
	const isLightMode = (localStorage.getItem("themeColor") === "light_mode"); // Vérification du thème actuel
	document.body.classList.toggle("light_mode", isLightMode); // Application du thème
	toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode"; // Mise à jour de l'icône
	
	chatList.innerHTML = savedChats || ""; // Affichage des messages sauvegardés

	document.body.classList.toggle("hideHeader", savedChats);
	chatList.scrollTo(0, chatList.scrollHeight); // Défilement vers le bas de la liste des messages
}

loadLocalStorageData(); // Chargement des données au démarrage

// Fonction pour créer un élément de message
function createMessageElement(content, ...classes) {
	const div = document.createElement("div"); // Création d'un div pour le message
	div.classList.add("message", ...classes); // Ajout des classes CSS
	div.innerHTML = content; // Insertion du contenu HTML
	return div; // Retourne l'élément créé
}

// Fonction pour afficher l'effet de saisie
function showTypingEffect(text, textElement, incomingMessageDiv) {
	const words = text.split(' '); // Séparation du texte en mots
	let currentWordIndex = 0; // Index du mot actuel

	const typingInterval = setInterval(() => {
		textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++]; // Ajout progressif des mots
		incomingMessageDiv.querySelector(".icon").classList.add("hide"); // Masquage de l'icône pendant la saisie

		if (currentWordIndex === words.length) {
			clearInterval(typingInterval); // Arrêt de l'intervalle une fois tous les mots ajoutés
			isResponseGenerating = false;
			incomingMessageDiv.querySelector(".icon").classList.remove("hide"); // Affichage de l'icône
			localStorage.setItem("savedChats", chatList.innerHTML); // Sauvegarde des messages dans le localStorage
		}
		chatList.scrollTo(0, chatList.scrollHeight); // Défilement vers le bas de la liste des messages
	}, 75); // Intervalle de 75ms entre chaque mot
}

// Fonction pour générer une réponse de l'API Gemini
async function generateAPIResponse(incomingMessageDiv) {
	const textElement = incomingMessageDiv.querySelector(".text"); // Sélection de l'élément texte du message entrant

	try {
		const response = await fetch(API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" }, // En-têtes de la requête
			body: JSON.stringify({
				contents: [{
					role: "user",
					parts: [{ text: userMessage }] // Message de l'utilisateur envoyé à l'API
				}]
			})
		});

		const data = await response.json(); // Conversion de la réponse en JSON

		const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1'); // Extraction et formatage de la réponse de l'API
		showTypingEffect(apiResponse, textElement, incomingMessageDiv); // Affichage de la réponse avec effet de saisie
	} catch (error) {
		isResponseGenerating = false;
		console.log(error); // Affichage de l'erreur en cas de problème
	} finally {
		incomingMessageDiv.classList.remove("loading"); // Suppression de la classe "loading"
	}
}

// Fonction pour afficher l'animation de chargement
function showLoadingAnimation() {
	const html = `<div class="messageContent">
							<img src="assets/gemini.svg" alt="Gemini Icon" class="avatar">
							<p class="text"></p>
							<div class="loadingIndicator"> 
								<div class="loadingBar"></div>
								<div class="loadingBar"></div>
								<div class="loadingBar"></div>
							</div>
						</div>
						<span class="icon material-symbols-rounded">content_copy</span>`;

	const incomingMessageDiv = createMessageElement(html, "incoming", "loading"); // Création de l'élément de message entrant avec animation de chargement
	chatList.appendChild(incomingMessageDiv); // Ajout du message à la liste

	chatList.scrollTo(0, chatList.scrollHeight); // Défilement vers le bas de la liste des messages

	const copyIcon = incomingMessageDiv.querySelector('.icon'); // Sélection de l'icône de copie
	copyIcon.addEventListener('click', () => copyMessage(copyIcon)); // Ajout de l'événement de copie

	generateAPIResponse(incomingMessageDiv); // Génération de la réponse de l'API
}

// Fonction pour copier le message dans le presse-papier
function copyMessage(copyIcon) {
	const messageText = copyIcon.parentElement.querySelector(".text").innerText;  // Sélection du texte du message

	if (messageText.trim() !== "") {
		navigator.clipboard.writeText(messageText) // Copie du texte dans le presse-papiers
			.then(() => {
				copyIcon.innerText = "done"; // Icône mise à jour
				setTimeout(() => copyIcon.innerText = "content_copy", 1000); // Réinitialisation de l'icône après 1 seconde
			})
			.catch(err => {
				console.error('Erreur lors de la copie : ', err); // Affichage de l'erreur en cas de problème
			});
	} else {
		console.error('Aucun texte à copier'); // Message d'erreur si le texte est vide
	}
}

// Fonction pour gérer l'envoi des messages
function handleOutgoingChat() {
	userMessage = typingForm.querySelector(".typingInput").value.trim() || userMessage;  // Récupération du message de l'utilisateur
	if (!userMessage || isResponseGenerating) return; // Si le message est vide, on arrête la fonction

	isResponseGenerating = true;

	const html = `<div class="messageContent">
							<img src="assets/user.jpg" alt="User Image Of A Man" class="avatar">
							<p class="text"></p>
						</div>`;

	const outgoingMessageDiv = createMessageElement(html, "outgoing"); // Création de l'élément de message sortant
	outgoingMessageDiv.querySelector(".text").innerText = userMessage; // Insertion du texte du message
	chatList.appendChild(outgoingMessageDiv); // Ajout du message à la liste

	typingForm.reset(); // Réinitialisation du formulaire de saisie
	chatList.scrollTo(0, chatList.scrollHeight); // Défilement vers le bas de la liste des messages
	document.body.classList.add("hideHeader"); // Cache le header quand la conversation commence
	setTimeout(showLoadingAnimation, 500); // Affichage de l'animation de chargement après 500ms
}

suggestions.forEach(suggestion => {
	suggestion.addEventListener("click", () => {
		userMessage = suggestion.querySelector(".text").innerText;
		handleOutgoingChat();
	});
});

// Gestion du changement de thème
toggleThemeButton.addEventListener("click", () => {
	const isLightmode = document.body.classList.toggle("light_mode"); // Changement de thème
	localStorage.setItem("themeColor", isLightmode ? "light_mode" : "dark_mode"); // Sauvegarde du thème dans le localStorage
	toggleThemeButton.innerText = isLightmode ? "dark_mode" : "light_mode"; // Mise à jour du texte du bouton
})

// Supprime du localStorage tout les messages quand le bouton est cliqué
deleteChatButton.addEventListener("click", () => {
	if (confirm("Etee-vous sure de vouloir supprimer tous les messages ?")) {
		localStorage.removeItem("savedChats");
		loadLocalStorageData();
	}
});

// Gestion de l'envoi du formulaire
typingForm.addEventListener("submit", (e) => {
	e.preventDefault(); // Empêche le rechargement de la page

	handleOutgoingChat(); // Gestion de l'envoi du message
});