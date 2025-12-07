import "mongoose";

declare module "mongoose" {
  namespace Types {
    // Relax constructor typing so we can build ObjectIds from strings
    // without tripping TS when using the bundled module resolution.
    class ObjectId {
      constructor(id?: any);
    }
  }
}
