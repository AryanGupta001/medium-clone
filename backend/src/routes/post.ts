import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import {sign, verify} from 'hono/jwt';
import { Param } from "@prisma/client/runtime/library";


export const postRouter=new Hono<{
    Bindings:{
        DATABASE_URL:string;
        JWT_SECRET:string;
        
    },
    Variables:{
        userId:string;
    }
}>();


postRouter.use('/*',async(c,next)=>{
    const authHeader = c.req.header("authorization") || "";
    try{
        const user=await verify(authHeader,c.env.JWT_SECRET);
    if(user){
        c.set("userId",user.id);
        await next();
    }
    else{
        c.status(411);
        return c.json({
            message:"not logged in"
        })
    }}
    catch(e){
        c.status(411);
        return c.json({
            message:"not logged in"
        })
    }
    
})

postRouter.get('/bulk',async(c)=>{
    
    const prisma=new PrismaClient({
    datasourceUrl:c.env.DATABASE_URL,}).$extends(withAccelerate())
    try{
        const posts=await prisma.post.findMany();
        return c.json({
            posts
        })
    }    
    catch(e){
        c.status(411);
        return c.json({
            message:"cannot get posts"
        })
    }
})

postRouter.post('/blog',async(c)=>{
    const body=await c.req.json();
    const authorId=c.get("userId")
    const prisma=new PrismaClient({
    datasourceUrl:c.env.DATABASE_URL,}).$extends(withAccelerate())

    const post= await prisma.post.create({
        data:{
            title:body.title,
            content:body.content,
            authorId:Number(authorId)
        }
    })

    return c.json({
        id:post.id
    })

})
postRouter.put('/blog',async(c)=>{
    const body=await c.req.json();
    const prisma=new PrismaClient({
    datasourceUrl:c.env.DATABASE_URL,}).$extends(withAccelerate())

    const post= await prisma.post.update({
        where:{
            id:body.id
        },
        data:{
            title:body.title,
            content:body.content,
        }
    })

    return c.json({
        id:post.id
    })
})

postRouter.get('/:id',async (c)=>{
    const id=c.req.param("id");
    const prisma=new PrismaClient({
    datasourceUrl:c.env.DATABASE_URL,}).$extends(withAccelerate())

    try{
        const post= await prisma.post.findFirst({
            where:{
                id:Number(id)
            }
        })

        return c.json({
            post
        })
    }catch(e){
        c.status(411);
        return c.json({
            message:"error while getting blog"
        })
    }
})

