export function preloadImages(paths: string[]): void {
  paths.forEach((path) => {
    const img = new Image();
    img.src = path;
  });
}
