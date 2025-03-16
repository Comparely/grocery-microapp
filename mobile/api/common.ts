export const fetchHomePageData = async () => {
    const url = `https://comparely-static-data.storage.googleapis.com/homepage.json?version=3`;
    const response = await fetch(url, {
        method: "GET",
        cache: 'no-store'
    });
    const data = await response.json();
    console.log("homepage", data)
    return [data.featuredProducts, data.categories]
}