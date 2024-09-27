import config from "./config.js";

const typingForm = document.querySelector(".typingForm");
const chatList = document.querySelector(".chatList");

let userMessage = null;

const API_KEY = config.apiKey;
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

function createMessageElement(content, ...classes) {
	const div = document.createElement("div");
	div.classList.add("message", ...classes);
	div.innerHTML = content;
	return div;
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

		const apiResponse = data?.candidates[0].content.parts[0].text;
		textElement.innerText = apiResponse;
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

	generateAPIResponse(incomingMessageDiv);
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
	setTimeout(showLoadingAnimation, 500);
}

typingForm.addEventListener("submit", (e) => {
	e.preventDefault();

	handleOutgoingChat();
});