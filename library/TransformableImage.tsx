import React, { Component, FunctionComponent, useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageLoadEventData, ImageProps, ImageStyle, ImageURISource, LayoutChangeEvent, NativeSyntheticEvent, StyleProp, View, ViewStyle } from 'react-native';
import ViewTransformer from '@gaoyunch/react-native-view-transformer';

type Pixels = {
  width: number
  height: number
}

export type TransformableImageProps = ImageProps & {
  style?: StyleProp<ViewStyle> & StyleProp<ImageStyle>
  source: ImageURISource
  pixels?: Pixels
  enableTransform?: boolean,
  enableScale?: boolean,
  enableTranslate?: boolean,
  onSingleTapConfirmed?: Function,
  onTransformGestureReleased?: Function,
  onViewTransformed?: Function
}

const TransformableImage: FunctionComponent<TransformableImageProps> = (props) => {

  const [imageLoaded, setImageLoaded] = useState(false);
  const [pixels, setPixels] = useState<Pixels | undefined>(props.pixels);
  const [keyAcumulator, setKeyAcumulator] = useState(1);
  const viewTransformerRef = useRef<ViewTransformer>(null);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const imageSource = useRef(props.source);

  /** 初始化执行 */
  useEffect(() => {
    if (!props.pixels) {
      getImageSize(props.source);
    }
  }, []);

  /** 当图片的source发生改变时执行 */
  useEffect(() => {
    if (!sameSource(props.source, imageSource.current)) {
      setPixels(undefined);
      setKeyAcumulator(keyAcumulator + 1);
      getImageSize(props.source);
      imageSource.current = props.source;
    }
  }, [props.source])

  const onLoadStart = () => {
    props.onLoadStart?.();
    setImageLoaded(false);
  }

  const onLoad = (event: NativeSyntheticEvent<ImageLoadEventData>) => {
    props.onLoad?.(event);
    setImageLoaded(true);
  }

  const onLayout = (event: LayoutChangeEvent) => {
    let layout = event.nativeEvent.layout;
    if (imageWidth !== layout.width || imageHeight !== layout.height) {
      setImageWidth(layout.width);
      setImageHeight(layout.height);
    }
  }

  const getImageSize = (source: ImageURISource) => {
    if (!source) return;
    if (source && source.uri) {
      Image.getSize(source.uri, (width, height) => {
        if (width && height) {
          if (pixels && pixels.width === width && pixels.height === height) {
            //no need to update state
          } else {
            setPixels({ width, height });
          }
        }
      }, (error) => {
        console.error('getImageSize...error=' + JSON.stringify(error) + ', source=' + JSON.stringify(source));
      })
    } else {
      console.warn('getImageSize...please provide pixels prop for local images');
    }
  }

  const getMaxScale = useMemo(() => {
    let maxScale = 1;
    const { width, height } = pixels || {};
    if (width && height) {
      if (imageWidth && imageHeight) {
        maxScale = Math.max(width / imageWidth, height / imageHeight);
        maxScale = Math.max(1, maxScale);
      }
    }
    return maxScale;
  }, [pixels, imageHeight, imageWidth])

  const getContentAspectRatio = useMemo(() => {
    const { width, height } = pixels || {};
    if (width && height) {
      return width / height;
    } else {
      return undefined
    }
  }, [pixels])

  return (
    <ViewTransformer
      ref={viewTransformerRef}
      key={`viewTransformer#${keyAcumulator}`}
      enableTransform={props.enableTransform && imageLoaded}
      enableScale={props.enableScale}
      enableTranslate={props.enableTranslate}
      enableResistance={true}
      onTransformGestureReleased={props.onTransformGestureReleased}
      onViewTransformed={props.onViewTransformed}
      onSingleTapConfirmed={props.onSingleTapConfirmed}
      maxScale={getMaxScale}
      contentAspectRatio={getContentAspectRatio}
      onLayout={onLayout}
      style={props.style}
    >
      <Image
        {...props}
        style={[props.style, { backgroundColor: 'transparent' }]}
        resizeMode={'contain'}
        onLoadStart={onLoadStart}
        onLoad={onLoad}
        capInsets={{ left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 }}
      />
    </ViewTransformer>
  )
}

TransformableImage.defaultProps = {
  enableTransform: true,
  enableScale: true,
  enableTranslate: true
}

export default TransformableImage;

const sameSource = (source: ImageURISource, nextSource: ImageURISource) => {
  if (source === nextSource) {
    return true;
  }
  if (source && nextSource) {
    if (source.uri && nextSource.uri) {
      return source.uri === nextSource.uri;
    }
  }
  return false;
}
