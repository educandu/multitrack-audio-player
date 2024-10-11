export class IdGenerator {
  generateId() {
    return `multitrack-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }
}
