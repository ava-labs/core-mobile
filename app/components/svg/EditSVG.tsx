import React, {useContext} from 'react';
import Svg, {Path} from 'react-native-svg';
import {useApplicationContext} from 'contexts/ApplicationContext';

interface Prop {
  color?: string;
}

function EditSVG({color}: Prop): JSX.Element {
  const context = useApplicationContext();

  const iconColor = color ?? context.theme.txtOnBgApp;
  return (
    <Svg width="17" height="16" viewBox="0 0 17 16" fill="none">
      <Path
        d="M15.0005 4.14422L13.9425 5.20225L11.2974 2.55391L12.3555 1.49587C12.571 1.28035 12.9465 1.28035 13.1621 1.49587L15.0005 3.33763C15.2226 3.55969 15.2226 3.92216 15.0005 4.14422ZM6.16075 12.9938L3.51567 10.3455L10.3537 3.49765L12.9988 6.14599L6.16075 12.9938ZM2.90502 11.6223L4.88393 13.6045L2.12782 14.3817L2.90502 11.6223ZM15.9443 2.3939L14.1058 0.552135C13.7466 0.192927 12.4502 -0.486304 11.415 0.552135L2.09843 9.87523C2.01679 9.95687 1.95801 10.0548 1.92862 10.1659L0.524443 15.1654C0.459132 15.3972 0.527708 15.6454 0.69425 15.8185C0.864058 15.9916 1.20367 16.021 1.34736 15.9883L6.34362 14.5809C6.45465 14.5515 6.55261 14.4927 6.63425 14.4111L15.9443 5.08796C16.6856 4.34668 16.6856 3.13844 15.9443 2.3939Z"
        fill={iconColor}
      />
    </Svg>
  );
}

export default EditSVG;
