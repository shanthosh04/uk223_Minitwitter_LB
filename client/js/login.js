class UserLogin {
    constructor(formSelector, messageSelector) {
        this.form = document.querySelector(formSelector);
        this.messageBox = document.querySelector(messageSelector);
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
    }

    async handleLogin(event) {
        event.preventDefault();

        const formData = new FormData(this.form);
        const credentials = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                throw new Error('Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.');
            }

            const { jwt } = await response.json();
            localStorage.setItem('token', jwt);
            this.showMessage('Login erfolgreich. Sie werden weitergeleitet...', 'success');
            
            setTimeout(() => {
                window.location.href = './tweet.html';
            }, 2000);
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    showMessage(message, type) {
        const messageClass = type === 'success' ? 'text-green-500' : 'text-red-500';
        this.messageBox.className = messageClass;
        this.messageBox.textContent = message;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new UserLogin('#loginForm', '#message');
});
