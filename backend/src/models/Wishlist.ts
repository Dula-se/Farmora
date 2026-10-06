import { Schema, model, Document, Types } from 'mongoose';

export interface IWishlist extends Document {
  id: string;
  userId: Types.ObjectId | string;
  produceId: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    produceId: { type: Schema.Types.ObjectId, ref: 'ProduceListing', required: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
  }
);

// Ensure a user cannot duplicate the same produce in their wishlist
wishlistSchema.index({ userId: 1, produceId: 1 }, { unique: true });

export const WishlistModel = model<IWishlist>('Wishlist', wishlistSchema);
