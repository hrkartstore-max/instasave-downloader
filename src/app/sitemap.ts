import type { MetadataRoute } from "next";
export default function sitemap():MetadataRoute.Sitemap{return ["","about","privacy","terms","contact","how-to-use"].map(p=>({url:"https://example.com/"+p,lastModified:new Date()}));}
