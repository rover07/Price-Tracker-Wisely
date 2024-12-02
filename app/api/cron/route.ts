import Product from "@/lib/models/product.model";

import { connectToDB } from "@/lib/mongoose";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils";
import { ApiError } from "next/dist/server/api-utils";
import { NextResponse } from "next/server";


export const maxDuration=60;
export const dynamic='force-dynamic';
export const revalidate=0;


export async function GET() {

    try {

        connectToDB();
        const products=await Product.find({});

        if(!products)throw new Error("NO PRODUCTS FOUND");

        //do something 
        //1.scrape latest product details and update Database





        const updatedProducts=await Promise.all(products.map(async(currentProduct)=>{
            const scrapedProduct=await scrapeAmazonProduct(currentProduct.url);
            if(!scrapedProduct) throw new Error(" NO NEW SCRAPED PRODUCT FOUND");

            const updatedPriceHistory=[
                ...currentProduct.priceHistory,
                
                {
                    price:scrapedProduct.currentPrice
                }
            ]

            const product={
                ...scrapedProduct,
                priceHistory:updatedPriceHistory,
                lowestPrice:getLowestPrice(updatedPriceHistory),
                highestPrice:getHighestPrice(updatedPriceHistory),
                averagePrice:getAveragePrice(updatedPriceHistory),
            }


        

        const updatedProduct=await Product.findOneAndUpdate(
           { url:product.url},
            product,
            
        )

        //check each product status and send the product accordingly

        const emailNotifType=getEmailNotifType(scrapedProduct,currentProduct)

        if(emailNotifType && updatedProduct.users.length>0){
            const productInfo={
                title:updatedProduct.title,
                url:updatedProduct.url
            }

            const emailContent=await generateEmailBody(productInfo,emailNotifType);
            const userEmails=updatedProduct.users.map((user:any)=>user.email)
            await sendEmail(emailContent,userEmails)
        }

        return updatedProduct;


            
            
            

        }))

        return NextResponse.json({
            message:"OK",
            data:updatedProducts
        })




        
    } catch (error) {
        
    }
    
}