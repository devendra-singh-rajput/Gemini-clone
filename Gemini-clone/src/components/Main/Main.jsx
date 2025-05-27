import React, { useState, useEffect, useRef } from 'react';
import { assets } from '../../assets/assets';
import { initializeChat, sendMessage } from '../../config/gemini'; // Adjust path if needed

const Main = () => {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]); // Stores messages: [{ role: 'user', text: '...' }, { role: 'model', text: '...' }]
  const [loading, setLoading] = useState(false);
  const [chatSession, setChatSession] = useState(null); // To store the Gemini chat session
  const chatEndRef = useRef(null); // Ref for scrolling to the bottom of the chat

  // Initialize chat session on component mount
  useEffect(() => {
    const init = async () => {
      try {
        const chat = await initializeChat();
        setChatSession(chat);
      } catch (error) {
        console.error("Failed to initialize chat session:", error);
        // Handle error, e.g., display an error message to the user
      }
    };
    init();
  }, []);

  // Scroll to the bottom of the chat history whenever it updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const onSend = async (message = input) => {
    if (!chatSession) {
      console.error("Chat session not ready.");
      return;
    }
    if (message.trim() === "") return;

    setLoading(true);
    // Add user message to history
    setChatHistory(prev => [...prev, { role: 'user', text: message }]);
    setInput(""); // Clear input field

    try {
      const responseText = await sendMessage(chatSession, message);
      if (responseText) {
        // Add model response to history
        setChatHistory(prev => [...prev, { role: 'model', text: responseText }]);
      }
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      // Handle error, e.g., display an error message in the chat
      setChatHistory(prev => [...prev, { role: 'error', text: "Error: Could not get a response." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (text) => {
    setInput(text); // Pre-fill input with card text
    onSend(text);    // Immediately send the message
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      onSend();
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-white">
      {/* Navbar */}
      <div className="flex items-center justify-between text-[22px] p-5 text-[#585858] max-w-[1300px] w-full mx-auto">
        <p>Gemini</p>
        <img src={assets.user_icon} alt="User Icon" className="h-8 w-8 rounded-full" />
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-[900px] mx-auto flex flex-col justify-between overflow-y-auto">
        <div className="p-5 flex-1">
          {chatHistory.length === 0 ? (
            // Initial Greeting and Cards
            <>
              <div className="my-10 text-[36px] md:text-[48px] lg:text-[56px] text-[#c4c7c5] font-medium">
                <p>
                  <span className="bg-gradient-to-br from-[#4b90ff] to-[#ff5546] bg-clip-text text-transparent">
                    Hello, dev.
                  </span>
                </p>
                <p>How can I help you today?</p>
              </div>

              {/* Cards */}
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
            // Chat history display
            <div className="flex flex-col gap-4">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && <img src={assets.gemini_icon} alt="Gemini Icon" className="h-8 w-8 rounded-full" />}
                  <p className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100 text-left'} ${msg.role === 'error' ? 'bg-red-100 text-red-700' : ''}`}>
                    {msg.text}
                  </p>
                  {msg.role === 'user' && <img src={assets.user_icon} alt="User Icon" className="h-8 w-8 rounded-full" />}
                </div>
              ))}
              <div ref={chatEndRef} /> {/* Scroll target */}
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="w-full px-4 py-4 bg-white">
          <div className="max-w-[900px] mx-auto">
            <div className="flex items-center justify-between gap-3 bg-[#f0f4f9] px-5 py-2.5 rounded-full">
              <input
                className="flex-1 outline-none border-none text-sm bg-transparent"
                type="text"
                placeholder="Enter a prompt here"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <div className="flex gap-3">
                {/* Optional: Add functionality for gallery/mic later */}
                <img className="w-5 cursor-pointer" src={assets.gallery_icon} alt="Gallery" />
                <img className="w-5 cursor-pointer" src={assets.mic_icon} alt="Mic" />
                <img
                  className={`w-5 cursor-pointer ${loading || input.trim() === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  src={assets.send_icon}
                  alt="Send"
                  onClick={() => !loading && onSend()} // Disable send if loading
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