import { Router, Request, Response } from 'express';
import { Database } from '../../database';

export class TweetController {
    router: Router;
    private database: Database;

    constructor() {
        this.router = Router();
        this.database = new Database();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.get('/', this.getTweets);
        this.router.get('/:id', this.getTweet);
        this.router.post('/', this.postTweet);
        this.router.patch('/:id', this.editTweet);
        this.router.delete('/:id', this.deleteTweet);
        this.router.get('/:id/comments', this.getTweetComments);
        this.router.post('/:id/comments', this.createTweetComment);
        this.router.patch('/:id/comments/:commentId', this.editTweetComment);
        this.router.delete('/:id/comments/:commentId', this.deleteTweetComment);
        this.router.post('/like', this.tweetLike);
        this.router.post('/dislike', this.tweetDislike);
    }

    private getTweets = async (req: Request, res: Response) => {
        const query = `SELECT tweets.id, tweets.content, tweets.created_at, users.username AS created_by, users.role AS user_role FROM tweets JOIN users ON tweets.user_id = users.id;`
        const tweets = await this.database.executeSQL(query);
        res.json(tweets);
    }

    private getTweet = async (req: Request, res: Response) => {
        const id = req.params.id
        const query = `SELECT tweets.id, tweets.content, tweets.created_at, users.username AS created_by, users.role AS user_role FROM tweets JOIN users ON tweets.user_id = users.id WHERE tweets.id = '${id}'`
        const tweets = await this.database.executeSQL(query);
        if (tweets.length === 0) {
            res.status(404).json({ message: "Tweet not found" })
            return
        }
        res.json(tweets);
    }


    private postTweet = async (req: Request, res: Response) => {
        const {  content } = req.body;
        if (!content) {
            return res.status(400).json({ message: 'Tweet is required' });
        }
        const userId = req.user?.id 
        const query = `INSERT INTO tweets (content, user_id) VALUES ('${content}', '${userId}')`;
        await this.database.executeSQL(query);
        res.status(201).json({ message: 'Tweet created' });
    };

    private editTweet = async (req: Request, res: Response) => {
        const tweet = await this.database.executeSQL(`SELECT user_id FROM tweets WHERE id = ${req.params.id}`)
        if (tweet.length === 0) {
            res.status(404).json({ message: "Tweet not found" })
            return
        }

        let canUpdate = false
        if (req.user?.id !== tweet[0].user_id) {
            if (req.user?.role === "admin" || req.user?.role === "mode") {
                canUpdate = true
            }
        } else {
            canUpdate = true
        }

        if (!canUpdate) {
           res.status(403).json({ message: "Forbidden" })
           return 
        }

        const { content } = req.body;
        const { id } = req.params;
        if (!content) {
            return res.status(400).json({ message: 'Tweet is required' });
        }
        const query = `UPDATE tweets SET content = '${content}' WHERE id = '${id}'`;
        const result =  await this.database.executeSQL(query);

        if (result.affectedRows === 0) {
            res.status(403).json({ message: "You can't edit this tweet" })
            return
        }
        res.status(200).json({ message: 'Tweet updated' });
    };

    private deleteTweet = async (req: Request, res: Response) => {
        const tweet = await this.database.executeSQL(`SELECT user_id FROM tweets WHERE id = ${req.params.id}`)
        if (tweet.length === 0) {
            res.status(404).json({ message: "Tweet not found" })
            return
        }

        let canDelete = false
        if (req.user?.id !== tweet[0].user_id) {
            if (req.user?.role === "admin" || req.user?.role === "mode") {
                canDelete = true
            }
        } else {
            canDelete = true
        }

        if (!canDelete) {
           res.status(403).json({ message: "Forbidden" })
           return 
        }
        const { id } = req.params;
        const query = `DELETE FROM tweets WHERE id = ${id}`;
        const result = await this.database.executeSQL(query);
        if (result.affectedRows === 0) {
            res.status(403).json({ message: "You can't delete this tweet" })
            return
        }
        res.status(200).json({ message: 'Tweet deleted' });
    };

    private getTweetComments = async (req: Request, res: Response) => {
        const query = `SELECT comments.id, comments.content, comments.created_at, users.username AS created_by FROM comments JOIN users ON comments.user_id = users.id WHERE comments.tweet_id = '${req.params.id}';`
        const comments = await this.database.executeSQL(query);
        res.json(comments);
    };

    private createTweetComment = async (req: Request, res: Response) => {
        const { content } = req.body;
        const userId = req.user?.id
        const tweetId = req.params.id
        const query = `INSERT INTO comments (user_id, tweet_id, content) VALUES (${userId}, ${tweetId}, '${content}')`;
        await this.database.executeSQL(query);
        res.status(201).json({ message: 'Comment created' });
    };

    private editTweetComment = async (req: Request, res: Response) => {
        const { content } = req.body;
        const { commentId } = req.params;
        const commentQueryResult = await this.database.executeSQL(`SELECT user_id FROM comments WHERE id = '${commentId}'`);
        if (commentQueryResult.length === 0) {
            res.status(404).json({ message: "Comment not found" });
            return;
        }
    
        const commentOwnerUserId = commentQueryResult[0].user_id;
        const isOwner = req.user?.id === commentOwnerUserId;
        const isAdminOrMode = req.user?.role === "admin" || req.user?.role === "mode";
    
        if (!isOwner && !isAdminOrMode) {
            res.status(403).json({ message: "Forbidden: You do not have permission to edit this comment." });
            return;
        }
        if (!content) {
            return res.status(400).json({ message: 'comment is required' });
        }
        const query = `UPDATE comments SET content = '${content}' WHERE id = '${commentId}'`;
        const result = await this.database.executeSQL(query);

        if (result.affectedRows === 0) {
            res.status(403).json({ message: "You can't edit this comment" })
            return
        }
        res.status(200).json({ message: 'Comment updated' });
    };

    private deleteTweetComment = async (req: Request, res: Response) => {
        const { commentId } = req.params;
        const commentQueryResult = await this.database.executeSQL(`SELECT user_id FROM comments WHERE id = '${commentId}'`);
        if (commentQueryResult.length === 0) {
            res.status(404).json({ message: "Comment not found" });
            return;
        }
    
        const commentOwnerUserId = commentQueryResult[0].user_id;
        const isOwner = req.user?.id === commentOwnerUserId;
        const isAdminOrMode = req.user?.role === "admin" || req.user?.role === "mode";
    
        if (!isOwner && !isAdminOrMode) {
            res.status(403).json({ message: "Forbidden: You do not have permission to delete this comment." });
            return;
        }
        const { id } = req.params;
        const query = `DELETE FROM comments WHERE id = '${commentId}'`;
        const result = await this.database.executeSQL(query);
        if (result.affectedRows === 0) {
            res.status(403).json({ message: "You can't delete this comment" })
            return
        }
        res.status(200).json({ message: 'Comment deleted' });
    };

    private tweetLike = async (req: Request, res: Response) => {
        const { tweet_id } = req.body;
        const user_id = req.user?.id;
        if (!tweet_id || !user_id) {
            return res.status(400).json({ message: 'Tweet ID and user ID are required' });
        }
        const query = `INSERT INTO reactions (user_id, tweet_id, type) VALUES (${user_id}, ${tweet_id}, 'like') ON DUPLICATE KEY UPDATE type='like'`;
        await this.database.executeSQL(query);
        res.status(201).json({ message: 'Like added' });
    };
    
    private tweetDislike = async (req: Request, res: Response) => {
        const { tweet_id } = req.body;
        const user_id = req.user?.id;
        if (!tweet_id || !user_id) {
            return res.status(400).json({ message: 'Tweet ID and user ID are required' });
        }
        const query = `INSERT INTO reactions (user_id, tweet_id, type) VALUES (${user_id}, ${tweet_id}, 'dislike') ON DUPLICATE KEY UPDATE type='dislike'`;
        await this.database.executeSQL(query);
        res.status(201).json({ message: 'Dislike added' });
    };
    
}
