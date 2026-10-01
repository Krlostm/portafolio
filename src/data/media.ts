import manifest from "./media-manifest.json";
import { url } from "./site";
export interface MediaImage {
  source: string;
  alt: string;
  width: number;
  height: number;
  src: string;
  variants: { src: string; width: number; height: number; bytes: number }[];
}
export interface MediaVideo {
  source: string;
  poster: string;
  full: string;
  preview?: string;
  duration: number;
}
export const images = manifest.images as Record<string, MediaImage>;
export const videos = manifest.videos as Record<string, MediaVideo>;
export function imageById(id: string): MediaImage {
  const v = images[id];
  if (!v) throw new Error("Unknown image: " + id);
  return v;
}
export function videoById(id: string): MediaVideo {
  const v = videos[id];
  if (!v) throw new Error("Unknown video: " + id);
  return v;
}
export const imageUrl = (id: string) => url(imageById(id).src);
export const imageSrcset = (id: string) =>
  imageById(id)
    .variants.map((v) => url(v.src) + " " + v.width + "w")
    .join(", ");
