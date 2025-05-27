import React, { useState } from 'react'
import { assets } from '../../assets/assets'

const Sidebar = () => {
    const [extended, setExtended] = useState(false)

    return (
        <div
            className={`sidebar min-h-screen flex flex-col justify-between bg-[#f0f4f9] p-4 transition-all duration-300 ${extended ? 'w-64' : 'w-20'
                }`}
        >
            {/* Top Section */}
            <div className="top space-y-6">
                <img
                    className="h-8 w-8 cursor-pointer"
                    src={assets.menu_icon}
                    alt="Menu"
                    onClick={() => setExtended(!extended)}
                />

                <div className="new-chat flex items-center justify-center gap-2 cursor-pointer bg-white p-2 rounded-full shadow">
                    <img className="h-8 " src={assets.plus_icon} alt="Plus" />
                    {extended && <p className='ml-2'>New Chat</p>}
                </div>


                {extended && (
                    <div className="recent">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Recent</p>
                        <div className="recent-entry flex items-center gap-2 p-2 rounded hover:bg-gray-200 cursor-pointer">
                            <img className="h-8" src={assets.message_icon} alt="Message" />
                            <p className="text-sm text-gray-700">What is React...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Section */}
            <div className="bottom space-y-4">
                <div className="bottom-item flex items-center gap-2 p-2 rounded hover:bg-gray-200 cursor-pointer">
                    <img className="h-6" src={assets.question_icon} alt="Help" />
                    {extended && <p>Help</p>}
                </div>
                <div className="bottom-item flex items-center gap-2 p-2 rounded hover:bg-gray-200 cursor-pointer">
                    <img className="h-6" src={assets.history_icon} alt="Activity" />
                    {extended && <p>Activity</p>}
                </div>
                <div className="bottom-item flex items-center gap-2 p-2 rounded hover:bg-gray-200 cursor-pointer">
                    <img className="h-6" src={assets.setting_icon} alt="Settings" />
                    {extended && <p>Settings</p>}
                </div>
            </div>
        </div>
    )
}

export default Sidebar
