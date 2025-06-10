import React, { useState, useEffect, useRef } from 'react';
import { assets } from '../../assets/assets';
import { initializeChat, sendMessage } from '../../config/gemini';
// import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const Main = () => {
  // State Management
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  const [displayResponse, setDisplayResponse] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const currentMessageIndex = useRef(-1);
  const chatEndRef = useRef(null);

  // Format response text with markdown-like styling
 const formatResponse = (text) => {
    // Split the text into paragraphs based on double newlines.
   const components = {
    // This custom renderer handles both inline code and multi-line code blocks.
    code({ node, inline, className, children, ...props }) {
      const [copied, setCopied] = useState(false);
      const match = /language-(\w+)/.exec(className || '');
      const codeText = String(children).replace(/\n$/, '');

      // Function to handle copying the code to the clipboard
      const handleCopy = () => {
        // We use the modern navigator.clipboard API for security and reliability.
        navigator.clipboard.writeText(codeText).then(() => {
          setCopied(true);
          // Reset the "Copied!" message after 2 seconds
          setTimeout(() => setCopied(false), 2000);
        });
      };

      // Case 1: Inline code (e.g., `const a = 1;`).
      // It's rendered with a simple, light background.
      if (inline) {
        return (
          <code className="bg-gray-200 text-gray-800 px-1.5 py-1 rounded-md font-mono text-sm" {...props}>
            {children}
          </code>
        );
      }

      // Case 2: A multi-line code block with a specified language.
      return match ? (
        <div className="my-6 relative group">
          {/* Header for the code block: shows language and copy button */}
          <div className="absolute top-0 right-0 flex items-center p-2 bg-gray-800 rounded-bl-lg rounded-tr-md z-10">
            <span className="text-xs text-gray-400 mr-3 font-sans uppercase">{match[1]}</span>
            <button onClick={handleCopy} className="text-gray-400 hover:text-white transition-colors" aria-label="Copy code">
              {copied ? (
                // Checkmark icon when copied
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              ) : (
                // Clipboard icon by default
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
              )}
            </button>
          </div>
          {/* The actual syntax-highlighted code */}
          <SyntaxHighlighter
            style={vscDarkPlus} // A professional dark theme for code
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {codeText}
          </SyntaxHighlighter>
        </div>
      ) : (
        // Case 3: A code block without a specified language.
        // Rendered as plain pre-formatted text with a dark background.
        <pre className="bg-gray-900 text-white p-4 rounded-md my-6 overflow-x-auto" {...props}>
          <code>{children}</code>
        </pre>
      );
    },
    // You can add more custom renderers here for other elements like h1, p, etc.
    // For example, to style headings:
    h3({node, ...props}) {
      return <h3 className="text-2xl font-bold mt-6 mb-4 text-gray-800 border-b pb-2" {...props} />
    }
  };

  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]} // This plugin adds support for GitHub Flavored Markdown (tables, etc.)
        components={components}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

  // Initialize Gemini chat session
  useEffect(() => {
    const initGeminiChat = async () => {
      try {
        const chat = await initializeChat();
        setChatSession(chat);
      } catch (error) {
        console.error("Failed to initialize chat session:", error);
        setChatHistory(prev => [...prev, { 
          role: 'error', 
          text: "Failed to initialize chat. Please refresh the page." 
        }]);
      }
    };
    initGeminiChat();
  }, []);

  // Auto-scroll and typing effects remain the same
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    if (isTyping && currentMessageIndex.current !== -1 &&
        displayResponse.length < chatHistory[currentMessageIndex.current]?.text.length) {
      const timeoutId = setTimeout(() => {
        setDisplayResponse((prev) => prev + chatHistory[currentMessageIndex.current].text[prev.length]);
      }, 1);
      return () => clearTimeout(timeoutId);
    } else if (isTyping) {
      setIsTyping(false);
    }
  }, [displayResponse, isTyping, chatHistory]);

  // Modified send function to handle formatted responses
  const onSend = async (message = input) => {
    if (!chatSession || message.trim() === "") return;

    setLoading(true);
    setIsTyping(false);
    setDisplayResponse("");

    // Add user message
    setChatHistory(prev => [...prev, { role: 'user', text: message }]);
    setInput("");

    try {
      const responseText = await sendMessage(chatSession, message);
      if (responseText) {
        setChatHistory(prev => {
          const newHistory = [...prev, { role: 'model', text: responseText }];
          currentMessageIndex.current = newHistory.length - 1;
          return newHistory;
        });
        setIsTyping(true);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setChatHistory(prev => [...prev, { 
        role: 'error', 
        text: "Error: Could not get a response. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Rest of your handlers remain the same
  const handleCardClick = (text) => {
    setInput(text);
    onSend(text);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      onSend();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert("Copied to clipboard!"))
      .catch((err) => console.error("Failed to copy:", err));
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-white">
      {/* Navbar remains the same */}
      <div className="flex items-center justify-between text-[22px] p-5 text-[#585858] max-w-[1300px] w-full mx-auto">
        <p>Gemini</p>
        <img src={assets.user_icon} alt="User Icon" className="h-8 w-8 rounded-full" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-[900px] mx-auto flex flex-col justify-between overflow-y-auto">
        <div className="p-5 flex-1 overflow-y-auto">
          {chatHistory.length === 0 ? (
            <>
              <div className="my-10 text-[36px] md:text-[48px] lg:text-[56px] text-[#c4c7c5] font-medium">
                <p>
                  <span className="bg-gradient-to-br from-[#4b90ff] to-[#ff5546] bg-clip-text text-transparent">
                    Hello, dev.
                  </span>
                </p>
                <p>How can I help you today?</p>
              </div>

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
            <div className="flex flex-col gap-4 h-40">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && <img src={assets.gemini_icon} alt="Gemini Icon" className="h-8 w-8 rounded-full" />}

                  <div className={`p-4 rounded-lg max-w-[80%] ${msg.role === 'user' 
                    ? 'bg-blue-100 text-right' 
                    : 'bg-gray-100 text-left'} ${msg.role === 'error' 
                    ? 'bg-red-100 text-red-700' : ''} flex flex-col`}>
                    
                    {/* Apply formatting to the response */}
                    <div className="text-left">
                      {msg.role === 'model' && index === currentMessageIndex.current && isTyping
                        ? formatResponse(displayResponse)
                        : formatResponse(msg.text)
                      }
                    </div>

                    {msg.role === 'model' && msg.text && (
                      <button
                        onClick={() => copyToClipboard(msg.text)}
                        className="mt-2 self-end bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600 transition duration-200"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                  
                  {msg.role === 'user' && <img src={assets.user_icon} alt="User Icon" className="h-8 w-8 rounded-full" />}
                </div>
              ))}
              
              {loading && chatHistory[currentMessageIndex.current]?.role === 'model' && isTyping && (
                <div className="flex items-start gap-4 justify-start">
                  <img src={assets.gemini_icon} alt="Gemini Icon" className="h-8 w-8 rounded-full" />
                  <div className="p-3 rounded-lg bg-gray-100 text-left animate-pulse">
                    <p>...</p>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input area remains the same */}
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
                disabled={loading}
              />
              <div className="flex gap-3">
                <img className="w-5 cursor-pointer" src={assets.gallery_icon} alt="Gallery" />
                <img className="w-5 cursor-pointer" src={assets.mic_icon} alt="Mic" />
                <img
                  className={`w-5 cursor-pointer ${loading || input.trim() === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  src={assets.send_icon}
                  alt="Send"
                  onClick={() => !loading && onSend()}
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