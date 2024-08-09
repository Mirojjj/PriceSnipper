import Product from "@/lib/models/product.model"
import { connectToDB } from "@/lib/mongoose"
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeAmazonProduct } from "@/lib/scrapper";
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils";
import { EmailProductInfo, User } from "@/types";
import { NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET()
{
    try {
        connectToDB()

        const products = await Product.find({});

        if(!products)throw new Error("No products found");

        const updatedProducts = await Promise.all(
            products.map(async (currentProduct)=>{
                const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);
                if(!scrapedProduct) throw new Error("No products was found");

                const updatedPriceHistory = [
                ...currentProduct.priceHistory, 
                {price: scrapedProduct.currentPrice}
                ]

                const product = {
                    ...scrapedProduct,
                    priceHistory :updatedPriceHistory,
                    lowestPrice: getLowestPrice(updatedPriceHistory),
                    highestPrice: getHighestPrice(updatedPriceHistory),
                    averagePrice: getAveragePrice(updatedPriceHistory),
                }

                const updatedProduct = await Product.findOneAndUpdate(
                    {url: product.url},
                    product,
                    )

                const emailNotifType = getEmailNotifType(scrapedProduct, currentProduct);   
                    
                if(emailNotifType && updatedProduct.users.length > 0){
                    const productInfo: EmailProductInfo = {
                        title: updatedProduct.title,
                        url: updatedProduct.url,
                        image: updatedProduct.image
                    }

                    const emailContent = await generateEmailBody(productInfo, emailNotifType);

                    const userEmails = await updatedProduct.users.map((user:User)=> user.email);

                    await sendEmail(emailContent, userEmails)
                }
                 return updatedProduct;   
            })
        )

        return NextResponse.json(
            {
                message: "OK",
                data: updatedProducts
            }
        )

    } catch (error) {
        throw new Error(`Error while fetching the product: ${error}`)   
    }
}