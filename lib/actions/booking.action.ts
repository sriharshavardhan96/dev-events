'use server';

import Booking from '@/database/booking.model';
import Event from '@/database/event.model';
import connectDB from "@/lib/mongodb";

export const createBooking = async ({ eventId, slug, email }: { eventId: string; slug: string; email: string; }) => {
    try {
        await connectDB();

        // 1. Validate Email
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!email || !emailRegex.test(email)) {
             return { success: false, error: 'invalid_email' };
        }

        // 2. Verify Event Exists
        const event = await Event.findById(eventId).select('_id');
        if (!event) {
            return { success: false, error: 'event_not_found' };
        }

        // 3. Check for Existing Booking (Explicit check or rely on unique index)
        // Since we want to return a specific 'already_booked' error without relying solely on the driver error code
        // (though handling error code 11000 is also valid), explicit check is cleaner for "business logic" errors.
        const existingBooking = await Booking.findOne({ eventId, email });
        if (existingBooking) {
            return { success: false, error: 'already_booked' };
        }

        // 4. Create Booking
        await Booking.create({ eventId, slug, email });

        return { success: true };
    } catch (e) {
        // Handle unique key error slightly redundantly but safely if race condition happens
        if (e && typeof e === 'object' && 'code' in e && e.code === 11000) {
            return { success: false, error: 'already_booked' };
        }

        console.error('Create booking failed:', e);
        return { success: false, error: 'unknown_error' };
    }
}