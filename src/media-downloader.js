export class MediaDownloader {
  downloadMedia(sourceUrl) {
    return fetch(sourceUrl).then(response => response.arrayBuffer());
  }
}
