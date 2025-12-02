import { GoogleGenAI } from "@google/genai";

// Fix for "Property 'env' does not exist on type 'ImportMeta'"
// We use process.env.API_KEY as per the project standard.
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export default ai;