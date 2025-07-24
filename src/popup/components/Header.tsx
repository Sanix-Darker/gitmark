import React from 'react';

interface HeaderProps {
  isFullScreen: boolean;
  onExpand?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isFullScreen, onExpand }) => {
  return (
    <div className="app-header">
      <h1 className="app-title">
        <svg
          fill="#000000"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          width="24px"
          height="18px"
          viewBox="0 0 535.72 535.72"
          style={{ transform: 'rotate(180deg)' }}
        >
          <g>
            <path d="M371.563,0H164.156c-7.515,0-13.599,6.089-13.599,13.599v509.349c0,5.393,3.134,10.049,7.687,12.252 c3.042,1.471,7.98-0.445,10.532-2.662l99.083-86.09l99.083,86.09c2.553,2.217,7.49,4.139,10.533,2.662 c4.547-2.203,7.686-6.859,7.686-12.252V13.605C385.168,6.089,379.079,0,371.563,0z" />
          </g>
        </svg>
        GitBookmark
      </h1>
      {!isFullScreen && onExpand && (
        <button
          className="btn-text"
          id="expand-btn"
          title="Open full screen"
          onClick={onExpand}
        >
          ⤢
        </button>
      )}
    </div>
  );
};
