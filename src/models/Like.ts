import mongoose, { Document, Schema } from 'mongoose';


export interface ILike extends Document {
  user: Schema.Types.ObjectId;
  post: Schema.Types.ObjectId;
  createdAt: Date;
}

const likeSchema = new Schema<ILike>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique user-post combinations
likeSchema.index({ user: 1, post: 1 }, { unique: true });

export default mongoose.model<ILike>('Like', likeSchema);
