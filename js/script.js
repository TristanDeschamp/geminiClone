const typingForm = document.querySelector(".typingForm");
const chatList = document.querySelector(".chatList");

let userMessage = null;

function createMessageElement(content, ...classes) {
	const div = document.createElement("div");
	div.classList.add("message", ...classes);
	div.innerHTML = content;
	return div;
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