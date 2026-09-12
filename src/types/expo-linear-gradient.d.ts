declare module 'expo-linear-gradient' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';
  import * as React from 'react';

  export interface LinearGradientProps extends ViewProps {
    colors?: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
    children?: React.ReactNode;
  }

  export const LinearGradient: ComponentType<LinearGradientProps>;
  export default LinearGradient;
}
