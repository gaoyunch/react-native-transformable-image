import React, { Component, FunctionComponent, useEffect, useRef, useState } from 'react';
import { Image, ImageProps, ImageStyle, ImageURISource, StyleProp, View, ViewStyle } from 'react-native';
import PropTypes from "prop-types";
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

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pixels, setPixels] = useState<Pixels>(undefined);
  const [keyAcumulator, setKeyAcumulator] = useState(1);
  const viewTransformerRef = useRef<ViewTransformer>(null);

  let maxScale = 1;
  let contentAspectRatio = undefined;
  let _width = props?.pixels?.width ?? pixels.width;
  let _height = props?.pixels?.height ?? pixels.height;
  if (_width && _height) {
    contentAspectRatio = _width / _height;
    if (width && height) {
      maxScale = Math.max(_width / width, _height / height);
      maxScale = Math.max(1, maxScale);
    }
  }

  useEffect(() => {
    if (!props.pixels) {
      getImageSize(props.source);
    }
  }, []);

  useEffect(() => {
    if (props.source) {
      setPixels(undefined);
      setKeyAcumulator(keyAcumulator + 1);
      getImageSize(props.source);
    }
  }, [props.source])

  const onLoadStart = () => {
    props.onLoadStart?.();
    setImageLoaded(false);
  }

  const onLoad = (e) => {
    props.onLoad?.(e);
    setImageLoaded(true);
  }

  const onLayout = (e) => {
    let layout = e.nativeEvent.layout;
    if (width !== layout.width || height !== layout.height) {
      setWidth(width);
      setHeight(height);
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

  return (
    <ViewTransformer
      ref={viewTransformerRef}
      key={`viewTransformer#${keyAcumulator}`}
      enableTransform={props.enableTransform && imageLoaded}
      enableScale={props.enableScale}
      enableTranslate={props.enableTranslate}
      onTransformGestureReleased={props.onTransformGestureReleased}
      onViewTransformed={props.onViewTransformed}
      onSingleTapConfirmed={props.onSingleTapConfirmed}
      maxScale={maxScale}
      contentAspectRatio={contentAspectRatio}
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
