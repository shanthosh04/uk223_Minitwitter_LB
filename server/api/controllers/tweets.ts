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
        const { id } = req.params;
        const query = `DELETE FROM tweets WHERE id = ${id}`;
        const result = await this.database.executeSQL(query);
        if (result.affectedRows === 0) {
            res.status(403).json({ message: "You can't delete this tweet" })
            return
        }
        res.status(200).json({ message: 'Tweet deleted' });
    };
}
