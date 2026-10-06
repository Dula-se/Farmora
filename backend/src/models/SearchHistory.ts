import { Schema, model, Document, Types } from 'mongoose';

export interface ISearchHistory extends Document {
  id: string;
  userId?: Types.ObjectId | string;
  query: string;
  category?: string;
  district?: string;
  resultCount: number;
  createdAt: Date;
}

const searchHistorySchema = new Schema<ISearchHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    query: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    district: { type: String, trim: true },
    resultCount: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

searchHistorySchema.index({ userId: 1, createdAt: -1 });
searchHistorySchema.index({ query: 1 });

export const SearchHistoryModel = model<ISearchHistory>('SearchHistory', searchHistorySchema);
