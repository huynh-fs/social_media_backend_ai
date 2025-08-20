import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IPost } from './Post';

export interface INotification extends Document {
  recipient: Schema.Types.ObjectId;
  sender: Schema.Types.ObjectId | IUser;
  type: 'like' | 'comment';
  post: Schema.Types.ObjectId | IPost;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'follow'],
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: false
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model<INotification>('Notification', notificationSchema);
