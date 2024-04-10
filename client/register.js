class UserRegistration {
    constructor(formSelector, messageSelector) {
        this.form = document.querySelector(formSelector);
        this.messageContainer = document.querySelector(messageSelector);
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this.registerUser();
        });
    }

    async registerUser() {
        const formData = new FormData(this.form);
        const userInfo = Object.fromEntries(formData);

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userInfo),
            });

            const data = await response.json();
            if (response.ok) {
                this.showMessage('Registrierung erfolgreich! Sie werden gleich weitergeleitet...', 'success');
                setTimeout(() => {
                    window.location.href = './html/login.html';
                }, 2000);
            } else {
                this.showMessage(data.message || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.', 'error');
            }
        } catch (error) {
            console.error('Fehler bei der Registrierung:', error);
            this.showMessage('Netzwerkfehler. Bitte versuche es später noch einmal.', 'error');
        }
    }

    showMessage(message, type) {
        const messageClass = type === 'success' ? 'text-green-500' : 'text-red-500';
        this.messageContainer.className = messageClass;
        this.messageContainer.textContent = message;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UserRegistration('#registerForm', '#message');
});
