import React from 'react';

export default function Header({ onToggleSidebar }) {
    return (
        <header className="border-b border-amber-200 p-4 flex items-center justify-between bg-white">
            <button 
                onClick={onToggleSidebar}
                className="p-2 hover:bg-amber-50 rounded-lg md:hidden"
            >
                <span className="material-icons">menu</span>
            </button>
            <h1 className="text-xl font-semibold text-amber-600">AI Chat</h1>
            <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-amber-50 rounded-lg">
                    <span className="material-icons">settings</span>
                </button>
            </div>
        </header>
    );
}