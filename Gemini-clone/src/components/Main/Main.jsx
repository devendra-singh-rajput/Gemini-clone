import React, { useState, useEffect, useRef } from 'react';
import { assets } from '../../assets/assets';
import { initializeChat, sendMessage } from '../../config/gemini'; // Adjust path if needed

const Main = () => {
  // --- State Management ---
  const [input, setInput] = useState(""); // Stores the current user input in the text box
  // Stores chat messages: [{ role: 'user', text: '...' }, { role: 'model', text: '...' }]
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false); // Indicates if a response is being fetched from Gemini
  const [chatSession, setChatSession] = useState(null); // Holds the initialized Gemini chat session object

  // --- Typing Effect States for Model Responses ---
  const [displayResponse, setDisplayResponse] = useState(""); // The portion of the response currently being "typed"
  const [isTyping, setIsTyping] = useState(false); // Flag to control the typing animation
  // Reference to track which specific model message in chatHistory is currently being typed
  const currentMessageIndex = useRef(-1);

  // --- Refs ---
  const chatEndRef = useRef(null); // Used for auto-scrolling to the bottom of the chat view

  // --- Effects ---

  // Effect 1: Initialize Gemini chat session on component mount
  useEffect(() => {
    const initGeminiChat = async () => {
      try {
        const chat = await initializeChat(); // Call your Gemini initialization function
        setChatSession(chat);
      } catch (error) {
        console.error("Failed to initialize chat session:", error);
        // TODO: In a real app, display a user-friendly error message here (e.g., a toast notification)
      }
    };
    initGeminiChat();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  // Effect 2: Auto-scroll to the bottom of the chat history whenever messages update
  useEffect(() => {
    // Scrolls the element referenced by chatEndRef into view with a smooth animation
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]); // Reruns whenever chatHistory changes (new messages added)

  // Effect 3: Implement the character-by-character typing animation for model responses
  useEffect(() => {
    // Check if typing is active and there are still characters to display for the current message
    if (isTyping && currentMessageIndex.current !== -1 &&
        displayResponse.length < chatHistory[currentMessageIndex.current]?.text.length) {

      const timeoutId = setTimeout(() => {
        // Append one character at a time to the displayResponse state
        setDisplayResponse((prev) => prev + chatHistory[currentMessageIndex.current].text[prev.length]);
      }, 30); // Typing speed (adjust milliseconds per character as desired)

      return () => clearTimeout(timeoutId); // Cleanup function to clear the timeout if component re-renders or unmounts
    } else if (isTyping) {
      // If typing was active but all text is now displayed, stop the typing effect
      setIsTyping(false);
    }
  }, [displayResponse, isTyping, chatHistory]); // Dependencies for the typing effect

  // --- Event Handlers ---

  /**
   * Handles sending a message to the Gemini API.
   * @param {string} [message=input] - The message to send. Defaults to the current input state.
   */
  const onSend = async (message = input) => {
    if (!chatSession) {
      console.error("Chat session not ready. Please wait for initialization.");
      // Optionally, give user feedback that the chat isn't ready
      return;
    }
    if (message.trim() === "") return; // Prevent sending empty messages

    setLoading(true); // Activate loading indicator
    setIsTyping(false); // Stop any ongoing typing effect
    setDisplayResponse(""); // Clear the currently displayed typed response

    // 1. Add user message to chat history
    setChatHistory(prev => [...prev, { role: 'user', text: message }]);
    setInput(""); // Clear the input field after sending

    try {
      const responseText = await sendMessage(chatSession, message); // Send message via Gemini API
      if (responseText) {
        // 2. Add model's response to chat history
        setChatHistory(prev => {
          const newHistory = [...prev, { role: 'model', text: responseText }];
          // Crucial: Set the index to the newly added model message for the typing effect
          currentMessageIndex.current = newHistory.length - 1;
          return newHistory;
        });
        setIsTyping(true); // Start the typing effect for the new model message
      }
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      // Display a user-friendly error message within the chat history
      setChatHistory(prev => [...prev, { role: 'error', text: "Error: Could not get a response from Gemini." }]);
    } finally {
      setLoading(false); // Deactivate loading indicator
    }
  };

  /**
   * Handles clicks on the prompt suggestion cards.
   * @param {string} text - The text from the clicked card.
   */
  const handleCardClick = (text) => {
    setInput(text); // Pre-fill the input box with the card's text
    onSend(text);   // Immediately send the pre-filled message
  };

  /**
   * Handles 'Enter' key press in the input field to send messages.
   * @param {KeyboardEvent} e - The keyboard event object.
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) { // Only send if 'Enter' is pressed and not already loading
      onSend();
    }
  };

  /**
   * Copies the given text to the user's clipboard.
   * @param {string} text - The text to copy.
   */
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert("Copied to clipboard!"); // Simple alert for confirmation
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        // TODO: Consider a more subtle notification system (e.g., a toast)
      });
  };

  // --- Component Render ---
  return (
    <div className="flex flex-col min-h-screen w-full bg-white">
      {/* --- Navbar --- */}
      <div className="flex items-center justify-between text-[22px] p-5 text-[#585858] max-w-[1300px] w-full mx-auto">
        <p>Gemini</p>
        <img src={assets.user_icon} alt="User Icon" className="h-8 w-8 rounded-full" />
      </div>

      {/* --- Main Content Area: Handles chat display and input --- */}
      <div className="flex-1 w-full max-w-[900px] mx-auto flex flex-col justify-between overflow-y-auto">
        <div className="p-5 flex-1 overflow-y-auto"> {/* Chat display area, allows scrolling */}
          {chatHistory.length === 0 ? (
            // --- Initial Greeting and Prompt Suggestion Cards (displayed when no chat history) ---
            <>
              <div className="my-10 text-[36px] md:text-[48px] lg:text-[56px] text-[#c4c7c5] font-medium">
                <p>
                  <span className="bg-gradient-to-br from-[#4b90ff] to-[#ff5546] bg-clip-text text-transparent">
                    Hello, dev.
                  </span>
                </p>
                <p>How can I help you today?</p>
              </div>

              {/* Grid for prompt suggestion cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { text: 'Suggest beautiful places to see on an upcoming road trip', icon: assets.compass_icon },
                  { text: 'Briefly summarize this concept: urban planning', icon: assets.bulb_icon },
                  { text: 'Brainstorm team bonding activities for our work retreat', icon: assets.message_icon },
                  { text: 'Improve the readability of the following code', icon: assets.code_icon },
                ].map((card, index) => (
                  <div
                    key={index}
                    onClick={() => handleCardClick(card.text)}
                    className="aspect-square bg-gray-100 hover:bg-[#dfe4ea] hover:shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer p-4 rounded-xl shadow flex flex-col justify-between"
                  >
                    <p className="text-[#585858] text-[15px] md:text-[17px]">{card.text}</p>
                    <img src={card.icon} alt="icon" className="h-10 w-10 self-end" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            // --- Chat history display (when messages exist) ---
            <div className="flex flex-col gap-4">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* Display Gemini icon for model messages */}
                  {msg.role === 'model' && <img src={assets.gemini_icon} alt="Gemini Icon" className="h-8 w-8 rounded-full" />}

                  {/* Message bubble for user, model, or error messages */}
                  <div className={`p-3 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100 text-left'} ${msg.role === 'error' ? 'bg-red-100 text-red-700' : ''} flex flex-col`}>
                    {/* Conditional rendering for typing effect on the current model message */}
                    <p>
                      {msg.role === 'model' && index === currentMessageIndex.current && isTyping
                        ? displayResponse // Show the typed portion
                        : msg.text // Show the full message text
                      }
                    </p>
                    {/* Copy button for model messages */}
                    {msg.role === 'model' && msg.text && (
                      <button
                        onClick={() => copyToClipboard(msg.text)}
                        className="mt-2 self-end bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600 transition duration-200"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                  {/* Display user icon for user messages */}
                  {msg.role === 'user' && <img src={assets.user_icon} alt="User Icon" className="h-8 w-8 rounded-full" />}
                </div>
              ))}
              {/* Simple loading indicator/placeholder while Gemini is "typing" its response */}
              {loading && chatHistory[currentMessageIndex.current]?.role === 'model' && isTyping && (
                <div className="flex items-start gap-4 justify-start">
                  <img src={assets.gemini_icon} alt="Gemini Icon" className="h-8 w-8 rounded-full" />
                  <div className="p-3 rounded-lg bg-gray-100 text-left animate-pulse">
                    <p>...</p> {/* Visual cue that content is loading/typing */}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} /> {/* Invisible element to scroll to */}
            </div>
          )}
        </div>

        {/* --- Bottom Input Area (fixed at the bottom) --- */}
        <div className="w-full px-4 py-4 bg-white border-t border-gray-200">
          <div className="max-w-[900px] mx-auto">
            <div className="flex items-center justify-between gap-3 bg-[#f0f4f9] px-5 py-2.5 rounded-full">
              <input
                className="flex-1 outline-none border-none text-sm bg-transparent"
                type="text"
                placeholder="Enter a prompt here"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading} // Disable input while a response is being fetched
              />
              <div className="flex gap-3">
                {/* Optional: Add functionality for gallery/microphone later */}
                <img className="w-5 cursor-pointer" src={assets.gallery_icon} alt="Gallery" />
                <img className="w-5 cursor-pointer" src={assets.mic_icon} alt="Mic" />
                <img
                  className={`w-5 cursor-pointer ${loading || input.trim() === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  src={assets.send_icon}
                  alt="Send"
                  onClick={() => !loading && onSend()} // Only allow sending if not loading and input is not empty
                />
              </div>
            </div>
            <p className="text-[13px] my-[15px] text-center font-medium text-[#585858]">
              Gemini may display inaccurate info, including about people. So double-check its responses. Your privacy and Gemini Apps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;