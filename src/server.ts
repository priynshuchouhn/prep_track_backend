import express from 'express';
import dotenv from "dotenv";
import authRouter from './routes/auth.js'
import { prisma } from './utils/prisma.js';
import cors from 'cors';

dotenv.config();


const app = express();
const PORT = process.env.PORT || 3008
app.use(cors(
    { origin: "*" }
));
app.use(express.json());

const apiV1Router = express.Router();
app.use('/api/v1', apiV1Router);


apiV1Router.get('/', async (req, res) => {
    console.log("api")
    const user = await prisma.user.findMany()
    res.json({ message: "Hello world", data: user, success: true });

})

apiV1Router.use('/auth', authRouter);
app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`)
})