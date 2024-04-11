document.addEventListener('DOMContentLoaded', () => {
    const app = new CommentApp('http://localhost:4200/api/tweets');
    app.initialize();
});

class CommentApp {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
    }

    async initialize() {
        await this.fetchAndDisplayTweet();
        await this.fetchAndDisplayComments();
        this.attachFormSubmitListener();
    }

    getTweetIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('tweetId');
    }

    async makeApiCall(endpoint, options = {}) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
        };
        const url = `${this.apiBaseUrl}/${endpoint}`;
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Error: ${error.message}`);
            this.displayMessage(`Error: ${error.message}`);
            throw error;
        }
    }

    async fetchAndDisplayTweet() {
        const tweetId = this.getTweetIdFromUrl();
        try {
            const tweet = await this.makeApiCall(tweetId);
            if (tweet) {
                this.displayTweet(tweet);
            } else {
                this.displayMessage('Tweet not found.');
            }
        } catch (error) {
            console.error(error);
        }
    }

    displayTweet(tweet) {
        const tweetContainer = document.getElementById('tweetContainer');
        tweetContainer.innerHTML = `
            <div class="tweet bg-gray-100 p-2 rounded-lg shadow">
                <p>${tweet.content}</p>
                <div class="tweet-info text-xs text-gray-500">
                    Posted by ${tweet.created_by} on ${new Date(tweet.created_at).toLocaleDateString("de-DE")}
                </div>
            </div>
        `;
    }

    async fetchAndDisplayComments() {
        const tweetId = this.getTweetIdFromUrl();
        try {
            const comments = await this.makeApiCall(`${tweetId}/comments`);
            this.displayComments(comments);
        } catch (error) {
            console.error(error);
        }
    }

    displayComments(comments) {
        const commentsContainer = document.getElementById('commentsContainer');
        commentsContainer.innerHTML = comments.map(comment => `
            <div class="comment bg-gray-100 p-2 rounded-lg shadow mb-4" data-comment-id="${comment.id}">
                <div class="flex justify-between mb-2">
                    <strong>${comment.created_by}:</strong>
                    <span class="date text-xs" style="font-size: 0.75rem; color: #666;">${new Date(comment.created_at).toLocaleDateString("de-DE")}</span>
                </div>
                <p>${comment.content}</p>
                <div class="comment-actions flex justify-end mt-2">
                    <button class="edit-btn py-1 px-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs" data-comment-id="${comment.id}">🖊️</button>
                    <button class="delete-btn py-1 px-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs ml-2" data-comment-id="${comment.id}">🗑️</button>
                </div>
            </div>
        `).join('') || '<p>No comments yet.</p>';
        this.attachCommentActionListeners();
    }

    attachFormSubmitListener() {
        const form = document.getElementById('commentForm');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const content = document.getElementById('content').value;
            const commentId = form.getAttribute('data-comment-id');
            const tweetId = this.getTweetIdFromUrl();
            if (!content.trim()) return;

            if (commentId) {
                await this.editComment(commentId, { content });
            } else {
                await this.postComment(tweetId, { content });
            }
            document.getElementById('content').value = '';
            form.removeAttribute('data-comment-id');
            await this.fetchAndDisplayComments();
        });
    }

    async postComment(tweetId, data) {
        await this.makeApiCall(`${tweetId}/comments`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async editComment(commentId, data) {
        const tweetId = this.getTweetIdFromUrl();
        await this.makeApiCall(`${tweetId}/comments/${commentId}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async deleteComment(commentId) {
        const tweetId = this.getTweetIdFromUrl();
        await this.makeApiCall(`${tweetId}/comments/${commentId}`, {
            method: 'DELETE'
        });
    }

    attachCommentActionListeners() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const commentId = event.target.getAttribute('data-comment-id');
                const contentElement = document.querySelector(`div[data-comment-id="${commentId}"] p`);
                document.getElementById('content').value = contentElement.textContent;
                document.getElementById('commentForm').setAttribute('data-comment-id', commentId);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const commentId = event.target.getAttribute('data-comment-id');
                await this.deleteComment(commentId);
                await this.fetchAndDisplayComments();
            });
        });
    }

    displayMessage(message) {
        alert(message);
    }
}
