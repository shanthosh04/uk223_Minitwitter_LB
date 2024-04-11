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
            const tweets = await this.makeApiCall(tweetId);
            if (tweets.length > 0) {
                this.displayTweet(tweets[0]);
            } else {
                this.displayMessage('Tweet not found.');
            }
        } catch (error) {
            console.error(error);
            this.displayMessage(error.toString());
        }
    }
    
    

    displayTweet(tweet) {
        const tweetContainer = document.getElementById('tweetContainer');
        const formattedDate = tweet.created_at ? new Date(tweet.created_at).toLocaleDateString("de-DE") : "Unknown date";
        tweetContainer.innerHTML = `
            <div class="tweet bg-white p-4 rounded-lg shadow mb-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-lg font-bold">${tweet.created_by || 'Unknown User'}</span>
                    <span class="text-gray-600 text-xs">${formattedDate}</span>
                </div>
                <p class="text-sm mb-2">${tweet.content || 'No content available'}</p>
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
        commentsContainer.innerHTML = comments.map(comment => {
            const commentContent = comment.content || 'No content available';
            const commentCreatedBy = comment.created_by || 'Unknown author';
            const commentCreatedAt = comment.created_at ? new Date(comment.created_at).toLocaleDateString("de-DE") : 'Unknown date';
            
            return `
                <div class="comment bg-gray-100 p-2 rounded-lg shadow mb-4" data-comment-id="${comment.id}">
                    <div class="flex justify-between mb-2">
                        <strong>${commentCreatedBy}:</strong>
                        <span class="date text-xs" style="font-size: 0.75rem; color: #666;">${commentCreatedAt}</span>
                    </div>
                    <p>${commentContent}</p>
                    <div class="comment-actions flex justify-end mt-2">
                        <button class="edit-btn py-1 px-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs" data-comment-id="${comment.id}">🖊️</button>
                        <button class="delete-btn py-1 px-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs ml-2" data-comment-id="${comment.id}">🗑️</button>
                    </div>
                </div>
            `;
        }).join('') || '<p>No comments yet.</p>';
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
