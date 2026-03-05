import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCXZLzmo8M7yLpXv15W6SYpKvwvDqPhXjI";

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [{
        functionDeclarations: [
            {
                name: "create_crop",
                description: "Crea un nuevo cultivo",
                parameters: {
                    type: "OBJECT",
                    properties: { name: { type: "STRING" } }
                }
            }
        ]
    }]
});

async function runTest() {
    try {
        const chat = model.startChat();
        const result = await chat.sendMessage("Crea un cultivo llamado Facundo");
        const response = result.response;

        console.log("Response text:", typeof response.text === 'function' ? response.text() : "no response.text");
        console.log("functionCalls():", response.functionCalls ? response.functionCalls() : "no functionCalls method");
        console.log("functionCall():", response.functionCall ? response.functionCall() : "no functionCall method");

        console.log("Raw Response JSON:", JSON.stringify(response, null, 2));
    } catch (e) {
        console.error(e);
    }
}

runTest();
