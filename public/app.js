const messagesList = document.querySelector('#messages');
const messageCount = document.querySelector('#message-count');
const statusMessage = document.querySelector('#status');
const form = document.querySelector('#message-form');
const authorInput = document.querySelector('#author');
const textInput = document.querySelector('#text');
const sendButton = document.querySelector('#send-message');
const formStatus = document.querySelector('#form-status');
let messages = [];
let loading = true;
let sending = false;

function renderMessages() {
  messagesList.replaceChildren();
  for (const message of messages) {
    const item = document.createElement('li');
    item.className = 'message';
    const author = document.createElement('p');
    author.className = 'message-author';
    author.textContent = message.author;
    const text = document.createElement('p');
    text.className = 'message-text';
    // textContent displays user text safely, including characters such as < >.
    text.textContent = message.text;
    item.append(author, text);
    messagesList.append(item);
  }
  messageCount.textContent = `${messages.length} message${messages.length === 1 ? '' : 's'}`;
  statusMessage.textContent = messages.length === 0 ? 'There are no messages yet.' : '';
}

async function loadMessages() {
  try {
    const response = await fetch('/api/messages');
    if (!response.ok) {
      throw new Error('The server could not load messages.');
    }

    messages = await response.json();
    renderMessages();
  } catch (error) {
    statusMessage.textContent = 'Could not load messages. Check that the server is running.';
    console.error(error);
  } finally {
    loading = false;
    sendButton.disabled = false;
  }
}

for (const input of [authorInput, textInput]) {
  input.addEventListener('input', () => input.setCustomValidity(''));
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (loading || sending) return;

  const author = authorInput.value.trim();
  const text = textInput.value.trim();
  authorInput.setCustomValidity(author ? '' : 'Please enter your name.');
  textInput.setCustomValidity(text ? '' : 'Please enter a message.');
  if (!form.reportValidity()) return;

  sending = true;
  sendButton.disabled = true;
  sendButton.textContent = 'Sending...';
  form.setAttribute('aria-busy', 'true');
  formStatus.classList.remove('error');
  formStatus.textContent = 'Sending your message...';
  try {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The server could not save your message.');

    messages.push(result);
    renderMessages();
    form.reset();
    formStatus.textContent = 'Message sent! It is now on the board.';
    authorInput.focus();
  } catch (error) {
    formStatus.classList.add('error');
    formStatus.textContent = error.message === 'Failed to fetch'
      ? 'Could not reach the server. Your message is still here; please try again.'
      : `Could not send your message. ${error.message}`;
  } finally {
    sending = false;
    sendButton.disabled = false;
    sendButton.textContent = 'Send message';
    form.removeAttribute('aria-busy');
  }
});

loadMessages();
