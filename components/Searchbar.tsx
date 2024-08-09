"use client";

import { scrapeAndStoreProduct } from "@/lib/actions";
import { FormEvent, useState } from "react";

const isValidAmazonProductUrl = (url: string) =>{
      try {
        const parsedUrl = new URL(url);
        const hostName = parsedUrl.hostname;

        if(hostName.includes("amazon.com")|| hostName.includes("amazon." || hostName.endsWith("amazon")))
        {
          return true;
        }

      } catch (error) {
        return false;
      }

      return false;

}

const Searchbar = () => {

  const [searchPrompt, setSearchPrompt] = useState('');
  const [isLoading, setIsLoading]= useState(false);

   const handleSubmit = async (event: FormEvent <HTMLFormElement>)=>{
    event.preventDefault();

    const isValidLink = isValidAmazonProductUrl(searchPrompt);

    // alert(isValidLink ? "Valid link": "Inlvalid link")

    if(!isValidLink) return alert("Please provide a proper link");

  try {
    setIsLoading(true);

    const product = await scrapeAndStoreProduct(searchPrompt);   


  } catch (error) {
    console.log(error);
  }finally{
    setIsLoading(false);
  }
  
} 
  return (
    <form className='flex flex-wrap gap-4 mt-12' onSubmit={handleSubmit}>
        <input type="text" value={searchPrompt} onChange={(e)=> setSearchPrompt(e.target.value)} placeholder="Enter amazon product link here" className=" searchbar-input"/>
        <button type="submit" disabled={searchPrompt === ""} className="searchbar-btn">{isLoading? "Searching...": "Search" }</button>
    </form>
  )
}

export default Searchbar