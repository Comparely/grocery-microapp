// export const fetchHomePageData = async () => {
//     const url = `https://comparely-static-data.storage.googleapis.com/homepage.json?version=3`;
//     const response = await fetch(url, {
//         method: "GET",
//         cache: 'no-store'
//     });
//     const data = await response.json();
//     console.log("homepage", data)
//     return [data.featuredProducts, data.categories]
// }

// @/api/common.ts
import homepageData from '../homepage.json';

export const fetchHomePageData = () => {
    try {
        // Use the local JSON data directly
        console.log('Using local homepage data:', homepageData);
        return {
            featuredProducts: homepageData.featuredProducts,
            featuredCategories: homepageData.categories,
        };
    } catch (error) {
        console.error('Error loading local homepage data:', error);
        return {
            featuredProducts: [],
            featuredCategories: [],
        };
    }
};
