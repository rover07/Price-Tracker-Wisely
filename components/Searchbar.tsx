
'use client'

import { scrapeAndStoreProduct } from "@/lib/actions"
import { scrapeAmazonProduct } from "@/lib/scraper"
import { FormEvent,useState } from "react"

const SearchBar = () => {
  const [searchPrompt, setSearchPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const isValidAmazonProdctURL=(url:string)=>{
    try {
      const parsedURL=new URL(url);
      const hostname=parsedURL.hostname;
      if(hostname.includes('amazon.com')||
      hostname.includes('amazon.') ||
      hostname.endsWith('amazon')||
      hostname.includes('amzn')
      
      ){return true;}
      // return true;
      return false;
    } catch (error) {
      return false;

      
    }

  }

    const handleSubmit=async (event:FormEvent<HTMLFormElement>)=>{
      event.preventDefault();

      const isValidLink=isValidAmazonProdctURL(searchPrompt);

      if(!isValidLink)return alert('Please provide a valide Amazon Link')

        try {
          setIsLoading(true);
          // scrape the product on amazon

          const product=await scrapeAndStoreProduct(searchPrompt);
        } catch (error) {
          console.log(error);
        }finally{
          setIsLoading(false);
        }
    }

  return (
    <form  className='flex flex-wrap gap-4 mt-12' 
    onSubmit={handleSubmit}>

    <input 
        type="text" 
        value={searchPrompt}
        onChange={(e)=>setSearchPrompt(e.target.value)}
        placeholder="Enter product link"
        className="searchbar-input"
    />

    <button type="submit" 
    className="searchbar-btn"
    disabled={searchPrompt===''}
    >
      {isLoading?'Searching.....':'Search'}
      
    </button>

    </form>
  )
}

export default SearchBar