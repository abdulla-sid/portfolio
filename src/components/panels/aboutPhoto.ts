import { lazyOnce } from "../../lib/lazyOnce";
import photo from "../../assets/about.jpeg";

export const aboutPhoto = photo;

export const warmAboutPhoto = lazyOnce(async () => {
  const image = new Image();
  image.src = aboutPhoto;
  await image.decode();
});
