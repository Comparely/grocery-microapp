import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const ThreeQuarterCircle: React.FC = () => {
  return (
    <View>
      <Svg height="15" width="15" viewBox="0 0 100 100">
  <Circle cx="50" cy="50" r="30" fill="#C6DB00" /> 

  <Path
    d="
      M 50,50
      L 50,5
      A 45,45 0 0,1 95,50
      Z
    "
    fill="white"
  />

  <Circle cx="50" cy="50" r="45" stroke="black" strokeWidth="10" fill="none" />
</Svg>

    </View>
  );
};

export default ThreeQuarterCircle;
