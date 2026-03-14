import React from 'react';

/**
 * TabBar - Navigation tabs for IDE sections
 */
const TabBar = ({ activeTab, onTabChange, tabs }) => {
    return (
        <div className="flex items-center gap-1 px-4 border-b border-neutral-700 bg-neutral-900">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-4 py-2.5 text-sm font-medium transition-all relative ${activeTab === tab.id
                            ? 'text-white'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                    )}
                </button>
            ))}
        </div>
    );
};

export default TabBar;
