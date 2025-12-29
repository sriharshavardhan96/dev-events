'use client';

import {useState} from "react";
import posthog from "posthog-js";
import { createBooking } from "@/lib/actions/booking.action";

const BookEvent = ({ eventId, slug }: { eventId: string, slug: string;}) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        setError('');

        try {
            const { success, error: serverError } = await createBooking({ eventId, slug, email });

            if(success) {
                setSubmitted(true);
                posthog.capture('event_booked', { eventId, slug })
            } else {
                let errorMessage = 'Booking creation failed. Please try again.';
                if (serverError === 'already_booked') {
                    errorMessage = 'You have already booked this event.';
                } else if (serverError === 'invalid_email') {
                    errorMessage = 'Please provide a valid email address.';
                } else if (serverError === 'event_not_found') {
                    errorMessage = 'This event could not be found.';
                }
                
                setError(errorMessage);
                posthog.captureException(new Error(errorMessage), { eventId, slug, serverError });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);
            posthog.captureException(err instanceof Error ? err : new Error(String(err)), { eventId, slug });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div id="book-event">
            {submitted ? (
                <p className="text-sm">Thank you for signing up!</p>
            ): (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            id="email"
                            placeholder="Enter your email address"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    <button 
                        type="submit" 
                        className="button-submit disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            )}
        </div>
    )
}
export default BookEvent