import React, {useContext} from 'react';
import Svg, {Path} from 'react-native-svg';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface Prop {
  selected: boolean;
}

function ActivitySVG({selected}: Prop) {
  const context = useContext(ApplicationContext);

  const svgColor = selected
    ? context.theme.accentColor
    : context.theme.onBgSearch;
  return (
    <Svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none">
      <Path
        d="M9.58333 5H5.91667C5.41067 5 5 5.41067 5 5.91667V9.58333C5 10.0893 5.41067 10.5 5.91667 10.5H9.58333C10.0893 10.5 10.5 10.0893 10.5 9.58333V5.91667C10.5 5.41067 10.0893 5 9.58333 5Z"
        fill={svgColor}
      />
      <Path
        d="M26.0834 5H13.25C12.744 5 12.3334 5.41067 12.3334 5.91667V9.58333C12.3334 10.0893 12.744 10.5 13.25 10.5H26.0834C26.5894 10.5 27 10.0893 27 9.58333V5.91667C27 5.41067 26.5894 5 26.0834 5Z"
        fill={svgColor}
      />
      <Path
        d="M9.58333 13.25H5.91667C5.41067 13.25 5 13.6607 5 14.1667V17.8333C5 18.3393 5.41067 18.75 5.91667 18.75H9.58333C10.0893 18.75 10.5 18.3393 10.5 17.8333V14.1667C10.5 13.6607 10.0893 13.25 9.58333 13.25Z"
        fill={svgColor}
      />
      <Path
        d="M26.0834 13.25H13.25C12.744 13.25 12.3334 13.6607 12.3334 14.1667V17.8333C12.3334 18.3393 12.744 18.75 13.25 18.75H26.0834C26.5894 18.75 27 18.3393 27 17.8333V14.1667C27 13.6607 26.5894 13.25 26.0834 13.25Z"
        fill={svgColor}
      />
      <Path
        d="M9.58333 21.5H5.91667C5.41067 21.5 5 21.9107 5 22.4167V26.0833C5 26.5893 5.41067 27 5.91667 27H9.58333C10.0893 27 10.5 26.5893 10.5 26.0833V22.4167C10.5 21.9107 10.0893 21.5 9.58333 21.5Z"
        fill={svgColor}
      />
      <Path
        d="M26.0834 21.5H13.25C12.744 21.5 12.3334 21.9107 12.3334 22.4167V26.0833C12.3334 26.5893 12.744 27 13.25 27H26.0834C26.5894 27 27 26.5893 27 26.0833V22.4167C27 21.9107 26.5894 21.5 26.0834 21.5Z"
        fill={svgColor}
      />
    </Svg>
  );
}

export default ActivitySVG;
