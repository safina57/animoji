export interface GalleryItem {
  image: string;
  text: string;
}

export interface CircularGalleryProps {
  items?: GalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  autoPlay?: boolean;
  autoPlaySpeed?: number;
}

export default function CircularGallery(props: CircularGalleryProps): JSX.Element;
