import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const Rating = ({ value = 0, text = '', color = '#ea580c', size = 'text-sm' }) => {
  const safeValue = Number(value) || 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex ${size}`}>
        {[1, 2, 3, 4, 5].map((index) => (
          <span key={index}>
            {safeValue >= index ? (
              <FaStar style={{ color }} />
            ) : safeValue >= index - 0.5 ? (
              <FaStarHalfAlt style={{ color }} />
            ) : (
              <FaRegStar style={{ color }} />
            )}
          </span>
        ))}
      </div>
      {text && (
        <span className="text-xs font-medium text-brand-orange-600 hover:text-orange-800 transition-colors cursor-pointer">
          {text}
        </span>
      )}
    </div>
  );
};

export default Rating;