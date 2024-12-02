'use server'


import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectToDB } from "../mongoose";
import { scrapeAmazonProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { User ,EmailContent} from "@/types";
import { generateEmailBody, sendEmail } from "../nodemailer";


export async function scrapeAndStoreProduct(productUrl:string){
    if(!productUrl)return ;

    try {

        await connectToDB();
        const scrapedProduct = await scrapeAmazonProduct(productUrl);

        let product =scrapedProduct;
        if(!scrapedProduct) return;

        const existingProduct=await Product.findOne({url:scrapedProduct.url})
    

        if(existingProduct){
            const updatedPriceHistory:any=[
                ...existingProduct.priceHistory,
                
                {
                    price:scrapedProduct.currentPrice
                }
            ]

            product={
                ...scrapedProduct,
                priceHistory:updatedPriceHistory,
                lowestPrice:getLowestPrice(updatedPriceHistory),
                highestPrice:getHighestPrice(updatedPriceHistory),
                averagePrice:getAveragePrice(updatedPriceHistory),
            }


        }

        const newProduct=await Product.findOneAndUpdate(
           { url:scrapedProduct.url},
            product,
            {
                upsert:true,new:true
            }
        )

        revalidatePath(`/products/${newProduct._id}`);
        
     
        
    } catch (error) {
        throw new Error("Failed to scrape/create/update product ");
        
    }
}


export async function getProductById(productId:string) {
    try{
        connectToDB();

        const product=await Product.findOne({_id:productId});

        if(!product)return null;
        return product;
        
    }catch(error){
        console.log(error);
    }
}


export async function getAllProducts(){
    try {
        connectToDB();
        const products=await Product.find();

        return products;
        
    } catch (error) {
        console.log(error)
    }
}


export async function getSimilarProducts(productId:string) {
    try {
        connectToDB();
        const currentProduct=await Product.findById(productId);

        if(!currentProduct)return null;

        const similarProducts=await Product.find({
            _id:{$ne:productId},

        }).limit(3);

        return similarProducts;

    } catch (error) {
        console.log(error);
    }
}


export async function addUserEmailToProduct(productId:string,userEmail:string){
    try {

        const product=await Product.findById(productId);

        if(!product)return ;

        const userExists=await product.users.some((user:User)=>user.email===userEmail)

        if(!userExists) {

            product.users.push({email:userEmail});

            await product.save();
            console.log("just below product.save in addUserEmailToProduct")
            const emailContent=await generateEmailBody(product,"WELCOME")
            console.log("email content" ,emailContent, "email content end")
            await sendEmail(emailContent,[userEmail]);

            console.log('just below sendEmail')
            
        }

        
    } catch (error) {
        console.log(error);
    }
}