import React from 'react';
import Svg, {Path} from 'react-native-svg';
import {useApplicationContext} from 'contexts/ApplicationContext';

interface Prop {
  selected: boolean;
  size: number;
}

function LightningBoltSVG({selected, size = 32}: Prop) {
  const context = useApplicationContext();

  const svgColor = selected
    ? context.theme.accentColor
    : context.theme.onBgSearch;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M23.3402 13.0117C23.2952 12.9279 23.2299 12.8583 23.1509 12.8098C23.072 12.7613 22.9822 12.7358 22.8908 12.7358H16.1237L17.2582 3.6044C17.2704 3.48219 17.2432 3.35922 17.1809 3.25529C17.1187 3.15136 17.0251 3.07252 16.9151 3.03146C16.8052 2.9904 16.6853 2.98951 16.5748 3.02893C16.4644 3.06836 16.3697 3.1458 16.3061 3.24879L8.07652 18.4366C8.02839 18.519 8.00202 18.6135 8.00011 18.7103C7.9982 18.807 8.02083 18.9026 8.06566 18.9871C8.1105 19.0716 8.17591 19.1419 8.25516 19.1909C8.33441 19.2399 8.42463 19.2657 8.51651 19.2657H15.1825L14.2834 28.4109C14.2746 28.5327 14.3047 28.6541 14.3689 28.7558C14.4331 28.8575 14.5278 28.9336 14.6378 28.9721C14.7478 29.0106 14.8669 29.0092 14.9762 28.9682C15.0854 28.9272 15.1784 28.8488 15.2405 28.7457L23.334 13.5595C23.381 13.4769 23.4063 13.3827 23.4074 13.2865C23.4085 13.1903 23.3853 13.0954 23.3402 13.0117Z"
        fill={svgColor}
        stroke={svgColor}
      />
    </Svg>
  );
}

export default LightningBoltSVG;
