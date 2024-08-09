import axios from "axios";
import * as cheerio from "cheerio";
import { extractCurrency, extractDescription, extractPrice } from "../utils";


export async function scrapeAmazonProduct(url:string){
    if(!url) return;

     const username = String(process.env.BRIGHT_DATA_USERNAME);
     const password = String(process.env.BRIGHT_DATA_PASSWORD);   
     const port = 22225;
     const session_id = (1000000 * Math.random()) | 0;

     const options = {
        auth:{
            username:`${username}-session-${session_id}`,
            password,
        },
        host: 'brd.superproxy.io',
        port,
        rejectUnauthorized:false,
        
     }

     try {
        const response = await axios.get(url, options);
        const $ = await cheerio.load(response.data);

        const title = $('#productTitle').text().trim();


        const currentPrice = extractPrice(
            $('.priceToPay span.a-price-whole'),
            $('.a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base'),
            $('.a-price.a-text-price')
          );

          const originalPrice = extractPrice(
            $('#priceblock_ourprice'),
            $('.a-price.a-text-price span.a-offscreen'),
            $('#listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price')
          );

          const outOfStock = $('#availability span').text().trim().toLowerCase() === 'currently unavailable';

          const images = 
          $('#imgBlkFront').attr('data-a-dynamic-image') || 
          $('#landingImage').attr('data-a-dynamic-image') ||
          '{}'

          const  imageUrls = Object.keys(JSON.parse(images));

          const currency = extractCurrency($('.a-price-symbol'));
            

          const discountRate = $('.savingsPercentage').text().trim().replace(/[-%]/g, "").slice(0,2);

          const ratingsText = $('span[data-hook="total-review-count"]').text().trim();
          const ratingsNumber = ratingsText.replace(/\D/g, "");

          const description = extractDescription($);

        // console.log({title, currentPrice, originalPrice, outOfStock, imageUrls, currency, discountRate, ratingsNumber, description})
 
            const data = {
                url,
                title,
                currency: currency || '$',
                image : imageUrls[0],
                currentPrice: Number(currentPrice) || Number(originalPrice),
                originalPrice: Number(originalPrice) || Number(currentPrice),
                priceHistory:[],
                discountRate:Number(discountRate),
                category: 'category',
                reviewsCount : Number(ratingsNumber),
                stars: 4.8,
                isOutOfStock: outOfStock,
                description,
                lowestPrice: Number(currentPrice) || Number(originalPrice),
                highestPrice: Number(originalPrice) || Number(currentPrice),
                averagePrice: Number(currentPrice) || Number(originalPrice),
            }

            return data;

     } catch (error: any) {
            throw new Error(`Failed to scrape product: ${error.message}`)
     }

}