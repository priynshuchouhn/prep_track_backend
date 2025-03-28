import { PrismaClient } from '@prisma/client';
import express from 'express';


export const prisma = new PrismaClient()
const app = express();
const PORT = process.env.PORT || 3000

app.get('/', async (req,res)=> {
    const user = await prisma.user.findMany()
    res.json({message: "Hello world", data:user, success: true});

})

app.listen(PORT, ()=>{
    console.log(`Server is running at ${PORT}`)
})