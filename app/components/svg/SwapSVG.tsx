import React, {useContext} from 'react';
import Svg, {Path} from 'react-native-svg';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface Prop {
  selected: boolean;
}

function SwapSVG({selected}: Prop) {
  const context = useContext(ApplicationContext);

  const svgColor = selected
    ? context.theme.primaryColor
    : context.theme.buttonIconSecondary;
  return (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <Path
        d="M16 29C23.1797 29 29 23.1797 29 16C29 8.8203 23.1797 3 16 3C8.8203 3 3 8.8203 3 16C3 23.1797 8.8203 29 16 29Z"
        fill={svgColor}
      />
      <Path
        d="M21.9019 12.3037H15.2736V10.3778C15.2736 10.0399 15.079 9.73216 14.7739 9.58713C14.4687 9.44215 14.1072 9.48577 13.8454 9.69911L10.4064 12.5005C10.2022 12.6667 10.0837 12.916 10.0837 13.1791C10.0837 13.4423 10.2022 13.6916 10.4064 13.8578L13.8454 16.6592C14.0046 16.7889 14.2006 16.8559 14.3984 16.8559C14.526 16.8559 14.6544 16.8281 14.774 16.7712C15.0792 16.6261 15.2737 16.3184 15.2737 15.9805V14.0546H21.902L21.9019 12.3037Z"
        fill={context.theme.bg}
      />
      <Path
        d="M22.4443 18.5712L19.0053 15.8574C18.742 15.6495 18.3831 15.6105 18.0811 15.7569C17.7793 15.9032 17.5876 16.2092 17.5876 16.5447V18.3831H10.9592V20.1339H17.5876V21.9723C17.5876 22.3077 17.7793 22.6137 18.0811 22.76C18.2024 22.8188 18.333 22.8477 18.4628 22.8477C18.656 22.8477 18.8477 22.7838 19.0052 22.6595L22.4442 19.9457C22.6546 19.7797 22.7772 19.5264 22.7772 19.2585C22.7772 18.9905 22.6547 18.7373 22.4443 18.5712Z"
        fill={context.theme.bg}
      />
    </Svg>
  );
}

export default SwapSVG;
