import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const ClockIcon: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = 'gray' }) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {/* Outer Circle */}
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
            {/* Clock hands - hour and minute */}
            <Path
                d="M12 8v4l3 2"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
};

export default ClockIcon;
