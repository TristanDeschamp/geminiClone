import config from "./config.js";

const typingForm = document.querySelector(".typingForm");
const chatList = document.querySelector(".chatList");
const toggleThemeButton = document.querySelector("#toggleThemeButton");

let userMessage = null;

const API_KEY = config.apiKey;
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

function loadLocalStorageData() {
	const savedChats = localStorage.getItem("savedChats");
	const isLightMode = (localStorage.getItem("themeColor") === "light_mode");
	
	document.body.classList.toggle("light_mode", isLightMode);
	toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

	chatList.innerHTML = savedChats || "";
	chatList.scrollTo(0, chatList.scrollHeight);
}

loadLocalStorageData();

function createMessageElement(content, ...classes) {
	const div = document.createElement("div");
	div.classList.add("message", ...classes);
	div.innerHTML = content;
	return div;
}

function showTypingEffect(text, textElement, incomingMessageDiv) {
	const words = text.split(' '); 
	let currentWordIndex = 0; 

	const typingInterval = setInterval(() => {
		textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
		incomingMessageDiv.querySelector(".icon").classList.add("hide");

		if (currentWordIndex === words.length) {
			clearInterval(typingInterval);
			incomingMessageDiv.querySelector(".icon").classList.remove("hide");
			localStorage.setItem("savedChats", chatList.innerHTML);
		}
		chatList.scrollTo(0, chatList.scrollHeight);
	}, 75);
}

async function generateAPIResponse(incomingMessageDiv) {
	const textElement = incomingMessageDiv.querySelector(".text");

	try {
		const response = await fetch(API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				contents: [{
					role: "user",
					parts: [{ text: userMessage }]
				}]
			})
		});

		const data = await response.json();

		const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
		showTypingEffect(apiResponse, textElement, incomingMessageDiv);
	} catch (error) {
		console.log(error);
	} finally {
		incomingMessageDiv.classList.remove("loading");
	}
}

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

	const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
	chatList.appendChild(incomingMessageDiv);

	chatList.scrollTo(0, chatList.scrollHeight);

	const copyIcon = incomingMessageDiv.querySelector('.icon');
	copyIcon.addEventListener('click', () => copyMessage(copyIcon));

	generateAPIResponse(incomingMessageDiv);
}

function copyMessage(copyIcon) {
	const messageText = copyIcon.parentElement.querySelector(".text").innerText;

	if (messageText.trim() !== "") {
		navigator.clipboard.writeText(messageText)
			.then(() => {
				copyIcon.innerText = "done"; // Icône mise à jour
				setTimeout(() => copyIcon.innerText = "content_copy", 1000);
			})
			.catch(err => {
				console.error('Erreur lors de la copie : ', err);
			});
	} else {
		console.error('Aucun texte à copier');
	}
}

function handleOutgoingChat() {
	userMessage = typingForm.querySelector(".typingInput").value.trim();
	if (!userMessage) return;

	const html = `<div class="messageContent">
							<img src="assets/user.jpg" alt="User Image Of A Man" class="avatar">
							<p class="text"></p>
						</div>`;

	const outgoingMessageDiv = createMessageElement(html, "outgoing");
	outgoingMessageDiv.querySelector(".text").innerText = userMessage;
	chatList.appendChild(outgoingMessageDiv);

	typingForm.reset();
	chatList.scrollTo(0, chatList.scrollHeight);
	setTimeout(showLoadingAnimation, 500);
}

toggleThemeButton.addEventListener("click", () => {
	const isLightmode = document.body.classList.toggle("light_mode");
	localStorage.setItem("themeColor", isLightmode ? "light_mode" : "dark_mode");
	toggleThemeButton.innerText = isLightmode ? "dark_mode" : "light_mode"
})

typingForm.addEventListener("submit", (e) => {
	e.preventDefault();

	handleOutgoingChat();
});