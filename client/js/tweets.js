class TweetApp {
    constructor() {
      this.apiBaseUrl = '/api/tweets';
      this.initialize();
    }
  
    async initialize() {
      await this.fetchAndDisplayTweets();
      this.attachFormSubmitListener();
    }
  
    async makeApiCall(endpoint, method = 'GET', data = null) {
      const token = localStorage.getItem('token');
      if (!token) {
        this.displayMessage('No authentication token found. User must be logged in.');
        return null;
      }
  
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
  
      const config = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
      };
  
      try {
        const response = await fetch(`${this.apiBaseUrl}/${endpoint}`, config);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        console.error(error);
        this.displayMessage(error.toString());
        return null;
      }
    }
  
    async fetchAndDisplayTweets() {
      const data = await this.makeApiCall('');
      if (!data) return;
  
      const tweets = Array.isArray(data) ? data : data.tweets;
      const messageContainer = document.getElementById('message');
      messageContainer.innerHTML = tweets.length
        ? tweets.map(tweet => this.tweetTemplate(tweet)).join('')
        : '<p>keine Tweets vorhanden.</p>';
    }
  
    tweetTemplate(tweet) {
      const username = tweet.created_by || 'Unbekannter Nutzer';
      const formattedDate = new Date(tweet.created_at).toLocaleDateString("de-DE");
      return `
        <div class="tweet bg-white p-4 rounded-lg shadow mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-lg font-bold">${username}</span>
            <span class="text-gray-600 text-xs">${formattedDate}</span>
          </div>
          <p class="text-sm mb-2">${tweet.content}</p>
          <div class="flex justify-between items-center">
          <div class="flex items-center space-x-2">
              <button onclick="tweetApp.likeTweet('${tweet.id}')" class="py-1 px-2 bg-green-500 hover:bg-green-600 text-white rounded text-xs">👍 ${tweet.likes_count}</button>
              <button onclick="tweetApp.dislikeTweet('${tweet.id}')" class="py-1 px-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs">👎 ${tweet.dislikes_count}</button>
              <button onclick="tweetApp.showComments('${tweet.id}')" class="py-1 px-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs">💬</button>
          </div>
          <div class="flex items-center space-x-2">
              <button onclick="tweetApp.editTweetInit('${tweet.id}')" class="py-1 px-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs">🖊️</button>
              <button onclick="tweetApp.deleteTweet('${tweet.id}')" class="py-1 px-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs">🗑️</button>
          </div>
      </div>
        </div>
      `;
    }
  
    attachFormSubmitListener() {
      const form = document.getElementById('tweetForm');
      form.addEventListener('submit', this.handleFormSubmit);
    }
  
    handleFormSubmit = async (e) => {
      e.preventDefault();
      const contentInput = document.getElementById('content');
      const tweetId = e.target.getAttribute('data-tweet-id');
  
      if (tweetId) {
        await this.editTweet(tweetId, { content: contentInput.value });
      } else {
        await this.postTweet({ content: contentInput.value });
      }
  
      contentInput.value = '';
      e.target.removeAttribute('data-tweet-id');
      await this.fetchAndDisplayTweets();
    }
  
    async postTweet(data) {
      const result = await this.makeApiCall('', 'POST', data);
      if (!result) {
        this.displayMessage('Failed to post tweet.');
      }
    }
  
    async editTweetInit(tweetId) {
      const tweet = await this.makeApiCall(tweetId);
      if (tweet && tweet.length > 0) {
        document.getElementById('content').value = tweet[0].content;
        document.getElementById('tweetForm').setAttribute('data-tweet-id', tweetId);
      } else {
        this.displayMessage('Failed to fetch tweet for editing.');
      }
    }
  
    async editTweet(tweetId, data) {
      const result = await this.makeApiCall(tweetId, 'PATCH', data);
      if (!result) {
        this.displayMessage('Failed to edit tweet.');
      }
    }
  
    async deleteTweet(tweetId) {
      const result = await this.makeApiCall(tweetId, 'DELETE');
      if (!result) {
        this.displayMessage('Failed to delete tweet.');
      } else {
        await this.fetchAndDisplayTweets();
      }
    }
  
  async likeTweet(tweetId) {
    const result = await this.makeApiCall(`like`, 'POST', { tweet_id: tweetId });
    if (!result) {
      this.displayMessage('Failed to like tweet.');
    } else {
      await this.fetchAndDisplayTweets();
    }
  }
  
  async dislikeTweet(tweetId) {
    const result = await this.makeApiCall(`dislike`, 'POST', { tweet_id: tweetId });
    if (!result) {
      this.displayMessage('Failed to dislike tweet.');
    } else {
      await this.fetchAndDisplayTweets();
    }
  }
  
  
  showComments(tweetId) {
    window.location.href = `comments.html?tweetId=${tweetId}`;
  }
  
  
    displayMessage(message) {
      alert(message);
    }
  }
  
  const tweetApp = new TweetApp();
  