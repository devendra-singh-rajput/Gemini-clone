// geminiChatService.js
import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} from "@google/generative-ai";

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// IMPORTANT: Replace with your actual API key if this is a placeholder.
// Best practice: Use environment variables for API keys in production.
// You might also consider loading this from an environment variable in your React app
// e.g., const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const API_KEY = "AIzaSyABm9vTEyO2DlNLPJdmQbrPSqeRzW0mpSE"; // Your provided key "AlzaSyCgbdDzk5iBJDP1k-dcNvyM7k9wsAihZctc"
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

const MODEL_NAME = "gemini-2.0-flash";

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

/**
 * Initializes and starts a new chat session with the Gemini model.
 * @param {Array} history - Optional: An array of initial messages to prime the chat.
 * Example: [{ role: "user", parts: [{ text: "Hi" }] }, { role: "model", parts: [{ text: "Hello!" }] }]
 * @returns {ChatSession} The initialized chat session object.
 */
export async function initializeChat(history = []) {
    const generationConfig = {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
    };

    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
    ];

    try {
        const chat = model.startChat({
            generationConfig,
            safetySettings,
            history,
        });
        console.log("Chat session initialized.");
        return chat;
    } catch (error) {
        console.error("Error initializing chat:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

/**
 * Sends a message to an ongoing chat session and returns the model's response.
 * @param {ChatSession} chat - The chat session object obtained from initializeChat.
 * @param {string} messageText - The message text to send.
 * @returns {Promise<string|null>} The text of the model's response, or null if an error occurs.
 */
export async function sendMessage(chat, messageText) {
    if (!chat) {
        console.error("Chat session is not initialized.");
        return null;
    }
    try {    
        const result = await chat.sendMessage(messageText);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error("Error sending message:", error);
        if (error.response && error.response.promptFeedback) {
            console.error("Prompt Feedback:", error.response.promptFeedback);
            return `Message blocked: ${error.response.promptFeedback.blockReason}`;
        }
        return null; // Or throw error
    }
}