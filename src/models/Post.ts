import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  content: string;
  imageURL?: string;
  user: Schema.Types.ObjectId;
  likes: Schema.Types.ObjectId[];
  comments: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>({
  content: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  imageURL: {
    type: String,
    default: ''
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }]
}, {
  timestamps: true
});

// Index for better query performance
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

export default mongoose.model<IPost>('Post', postSchema);
