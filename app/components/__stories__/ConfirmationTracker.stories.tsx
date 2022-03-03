import {storiesOf} from '@storybook/react-native';
import React, {FC, useEffect, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import ConfirmationTracker from 'screens/bridge/ConfirmationTracker';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black',
  },
});

storiesOf('Confirmation Tracker', module).add('Tracker', () => <Container />);

/**
 * Use Container if need to access hooks prior to calling component. Otherwise just use component directly. See other
 * component stories for examples.
 * @constructor
 */
const Container: FC = () => {
  const theme = useApplicationContext().theme;
  const [testStep, setTestStep] = useState(0);
  const requiredSteps = 50;

  useEffect(() => {
    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      if (counter % 5) {
        const nextStep = testStep + 1;
        setTestStep(nextStep);
      }

      if (testStep === 15) {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [testStep]);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setTestStep(0)}>
        <AvaText.Heading3>Press to reset</AvaText.Heading3>
      </Pressable>
      <Space y={32} />
      <View
        style={{
          backgroundColor: theme.colorBg2,
          borderRadius: 10,
          paddingHorizontal: 16,
          overflow: 'hidden',
        }}>
        <ConfirmationTracker
          started={true}
          requiredCount={requiredSteps}
          currentCount={testStep}
        />
      </View>
    </View>
  );
};

/**
 * import React, { useRef, Fragment } from "react";
 import { VerticalFlex, HorizontalFlex } from "./../components/Layout";
 import { Typography } from "./../components/Typography";
 import styled, { keyframes, css } from "styled-components";

 export const rotate = keyframes`
 from {
    transform: rotate(0deg);
  }

 to {
    transform: rotate(360deg);
  }
 `;

 export const fadeOut = keyframes`
 0% {
    opacity: 1;
    width: 100%;
    height: 100%;
  }

 99% {
    opacity: 0;
    width: 100%;
    height: 100%;
  }

 100% {
    opacity: 0;
    width: 0;
    height: 0;
  }
 `;

 export const pulse = (props: any) => keyframes`
 0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 ${props.theme.colors.bg3};
  }

 70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px ${props.theme.colors.bg3};
  }

 100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 ${props.theme.colors.bg3};
  }
 `;

 export const move = keyframes`
 0% {
    left: 0;
  }

 100% {
    left: 100%;
  }
 `;

 export const appear = keyframes`
 0% {
    max-height: 0;
  }

 100% {
    max-height: 500px;
  }
 `;

 interface ConfirmationTrackerProps {
  started: boolean;
  requiredCount: number;
  currentCount: number;
  className?: string;
}

 const Container = styled(HorizontalFlex)`
 justify-content: space-between;
 position: relative;
 min-width: 311px;
 max-width: 100%;
 `;

 const Line = styled.div<{
  active: boolean;
  complete: boolean;
  width: number;
  grow?: boolean;
}>`
 width: ${({ width }) => width}px;
 height: 2px;
 margin-top: 9px;
 position: relative;
 background: ${({ active, complete, theme }) =>
    active || complete ? theme.colors.stroke2 : theme.colors.stroke1};
 ${({ grow }) => grow && "width: 100%;"};
 transition: background-color 0.5s;
 `;

 const Dot = styled.div`
 width: 4px;
 height: 4px;
 border-radius: 50%;
 background: ${({ theme }) => theme.colors.stroke2};
 position: absolute;
 top: -1px;
 animation: ${move} 1.6s infinite ease-in;
 ${(props: { delay?: number }) =>
    props.delay &&
    css`
      animation-delay: ${props.delay}s;
    `};
 `;

 const Circle = styled(HorizontalFlex)`
 border: ${({ theme }) => `3px solid ${theme.colors.text1}`};
 border-radius: 50%;
 width: 20px;
 height: 20px;
 justify-content: center;
 align-items: center;
 transition: background-color 0.5s;
 z-index: 1;

 ${(props: { complete: boolean; active: boolean; theme: any }) =>
    css`
      background: ${props.complete
        ? props.theme.colors.stroke2
        : "transparent"};
      ${props.active
        ? css`
            animation: ${pulse} 1.6s infinite;
            animation-delay: 1.6s;
          `
        : ``}
    `};
 `;

 const Label = styled(Typography)`
 position: absolute;
 top: 10px;
 `;

 const StartLabel = styled(Label)`
 left: 0;
 background-color: ${({ theme }) => theme.colors.bg2};
 z-index: 1;
 `;

 const FinishLabel = styled(Label)`
 right: 0;
 background-color: ${({ theme }) => theme.colors.bg2};
 z-index: 1;
 `;

 const DashedLine = styled.div`
 width: 40px;
 height: 0px;
 background-color: ${({ theme }) => theme.colors.stroke2};
 position: absolute;
 left: 20px;
 top: 9px;
 border-top: 2px dashed ${({ theme }) => theme.colors.bg1};
 z-index: 1;
 `;

 const DashedLineEnd = styled(DashedLine)`
 right: 20px;
 left: auto;
 background-color: ${({ theme }) => theme.colors.stroke1}; ;
 `;

 const SliderContainer = styled(HorizontalFlex)`
 position: relative;
 overflow: hidden;
 flex-grow: 1;
 height: 63px;
 padding: 10px 0 0 0;
 `;

 const Slider = styled.div<{
  left: string;
}>`
 position: absolute;
 display: flex;
 left: ${({ left }) => left};
 transition: left 0.5s ease-in-out;
 min-width: 100%;
 `;

 export function ConfirmationTracker({
  started,
  requiredCount,
  currentCount,
  ...props
}: ConfirmationTrackerProps) {
  const numberOfDots = requiredCount - 1;
  const containerRef = useRef<HTMLDivElement>(null);

  const calculateLineWidth = () => {
    const containerWidth = containerRef.current?.clientWidth;
    if (!containerWidth) {
      return 90;
    }
    return (containerWidth - 4 * 20) / 3;
  };

  const renderLine = (complete: boolean, active: boolean, grow = false) => (
    <Line
      width={calculateLineWidth()}
      complete={complete}
      active={active}
      grow={grow}
    >
      {active && (
        <>
          <Dot />
          <Dot delay={0.45} />
          <Dot delay={0.9} />
        </>
      )}
    </Line>
  );

  const dots = [];
  for (let i = 1; i <= numberOfDots; i++) {
    const active = started && currentCount < i && currentCount >= i - 1;
    dots.push(
      <Fragment key={`container-${i}`}>
        {renderLine(currentCount >= i, active)}
        <VerticalFlex align="center">
          <Circle complete={currentCount >= i} active={active} />
          <Label margin="25px 0 0" size={14}>
            {i}/{requiredCount}
          </Label>
        </VerticalFlex>
      </Fragment>
    );
  }
  const lastStepActive =
    started && currentCount < requiredCount && currentCount >= numberOfDots;
  const showBreakEnd = currentCount < requiredCount - 2 && requiredCount > 3;

  let left = 0;
  if (currentCount > 1) {
    if (!showBreakEnd) {
      left = -(calculateLineWidth() + 20) * (requiredCount - 3);
    } else {
      left = -(calculateLineWidth() + 20) * (currentCount - 1);
    }
  }

  return (
    <Container ref={containerRef} {...props}>
      <VerticalFlex margin="10px 0 0 0" align="center" position="relative">
        <Circle complete={started} active={false} />
        <StartLabel margin="25px 0 0 0" size={14}>
          Start
        </StartLabel>
        {currentCount > 1 && <DashedLine />}
      </VerticalFlex>
      <SliderContainer>
        <Slider left={`${left}px`}>
          {dots}
          {renderLine(
            currentCount >= requiredCount,
            lastStepActive,
            requiredCount === 1
          )}
        </Slider>
      </SliderContainer>
      <VerticalFlex margin="10px 0 0 0" align="center" position="relative">
        <Circle
          complete={currentCount >= requiredCount}
          active={lastStepActive}
        />
        <FinishLabel margin="25px 0 0 0" size={14}>
          Final
        </FinishLabel>
        {showBreakEnd && <DashedLineEnd />}
      </VerticalFlex>
    </Container>
  );
}
 */
