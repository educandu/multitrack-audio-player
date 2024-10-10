export class IdProvider {
  createId() {
    return `multitrack-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }
}
