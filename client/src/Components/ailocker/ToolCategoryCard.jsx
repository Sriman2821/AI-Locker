import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

// Compact tile used inside each category panel: icon + label
const ToolCategoryCard = React.memo(({ tool }) => {
  const openTool = React.useCallback(() => {
    try {
      if (tool?.url && /^https?:\/\//i.test(tool.url)) {
        window.open(tool.url, '_blank', 'noopener,noreferrer');
        return;
      }
    } catch (e) {
      // ignore
    }
    try {
      window.location.href = `/tools/${tool._id}`;
    } catch (e) {
      try { location.assign(`/tools/${tool._id}`); } catch (_) {}
    }
  }, [tool]);

  return (
    <motion.div layout className="flex flex-col items-center text-center cursor-pointer p-1" onClick={openTool} role="button" tabIndex={0}>
      <div className="w-12 h-12 bg-[#F9E9EA] rounded flex items-center justify-center mb-1 border border-[#F0D6D9]">
        {tool.url ? (
          <img 
            src={`https://www.google.com/s2/favicons?domain=${new URL(tool.url).hostname}&sz=32`}
            alt={`${tool.name} icon`}
            className="w-7 h-7"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = tool.icon_name ? null : "";
              e.target.className = "hidden";
              e.target.parentElement.innerHTML = tool.icon_name ? 
                `<span class="text-xl text-[#D97783]">${tool.icon_name}</span>` :
                '<svg class="w-7 h-7 text-[#D97783]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
            }}
          />
        ) : tool.icon_name ? (
          <span className="text-xl text-[#D97783]">{tool.icon_name}</span>
        ) : (
          <ExternalLink className="w-6 h-6 text-[#D97783]" />
        )}
      </div>
      <div className="text-xs text-gray-700 font-light truncate max-w-[96px]">{tool.name}</div>
    </motion.div>
  );
});

ToolCategoryCard.displayName = 'ToolCategoryCard';

export default ToolCategoryCard;