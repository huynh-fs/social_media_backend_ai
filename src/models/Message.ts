    import { Schema, model, Document, Types } from 'mongoose';
import { IUser } from './User'; // Giả sử bạn có interface này

export interface IMessage extends Document {
  sender: Types.ObjectId | IUser;
  receiver: Types.ObjectId | IUser;
  content: string;
}

const messageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true });

export default model<IMessage>('Message', messageSchema);