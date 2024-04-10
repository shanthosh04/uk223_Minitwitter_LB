const USER_TABLE = `
CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'mode', 'user') NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
`

const TWEET_TABLE = `
CREATE TABLE IF NOT EXISTS tweets (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    content VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
`

const COMMENT_TABLE = `
CREATE TABLE IF NOT EXISTS comments (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    tweet_id INT NOT NULL,
    content VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tweet_id) REFERENCES tweets(id)
);
`

const REACTION_TABLE = `
CREATE TABLE IF NOT EXISTS reactions (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    tweet_id INT NOT NULL,
    type ENUM('like', 'dislike') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tweet_id) REFERENCES tweets(id)
);
`

export { USER_TABLE, TWEET_TABLE, COMMENT_TABLE, REACTION_TABLE }
