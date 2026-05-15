import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import Event from './event.model';

// Interface for Booking document type safety
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const bookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      validate: {
        validator: (v: string) => emailRegex.test(v),
        message: 'Invalid email format',
      },
    },
  },
  { timestamps: true }
);

// Index on eventId for faster queries when retrieving bookings by event
bookingSchema.index({ eventId: 1 });

// Pre-save hook: Verify that the referenced event exists
bookingSchema.pre('save', async function (next) {
  try {
    // Check if event exists only on document creation or when eventId is modified
    if (this.isNew || this.isModified('eventId')) {
      const eventExists = await Event.exists({ _id: this.eventId });
      if (!eventExists) {
        throw new Error(
          `Event with ID ${this.eventId} does not exist. Cannot create booking for non-existent event.`
        );
      }
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Create or retrieve the Booking model
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
