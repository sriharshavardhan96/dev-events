import {NextRequest, NextResponse} from "next/server";
import { v2 as cloudinary } from 'cloudinary';

import connectDB from "@/lib/mongodb";
import Event from '@/database/event.model';

/**
 * Create a new event from multipart form data, upload the provided image to Cloudinary, and store the event in the database.
 *
 * @param req - A NextRequest whose body is multipart/form-data and must include an `image` file; `tags` and `agenda` are expected as JSON-encoded strings.
 * @returns A JSON NextResponse:
 *   - status 201 with `{ message: 'Event created successfully', event }` on success,
 *   - status 400 with an error message for invalid input (missing image, malformed JSON),
 *   - status 500 with `{ message: 'Event Creation Failed', error }` on server error.
 */
export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const formData = await req.formData();

        let event;

        try {
            event = Object.fromEntries(formData.entries());
        } catch (e) {
            return NextResponse.json({ message: 'Invalid JSON data format'}, { status: 400 })
        }

        const file = formData.get('image') as File;

        if(!file) return NextResponse.json({ message: 'Image file is required'}, { status: 400 })

        let tags, agenda;
        try {
            tags = JSON.parse(formData.get('tags') as string);
            agenda = JSON.parse(formData.get('agenda') as string);
        } catch {
            return NextResponse.json({ message: 'Invalid tags or agenda format' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'DevEvent' }, (error, results) => {
                if(error) return reject(error);

                resolve(results);
            }).end(buffer);
        });

        event.image = (uploadResult as { secure_url: string }).secure_url;

        const createdEvent = await Event.create({
            ...event,
            tags: tags,
            agenda: agenda,
        });
        return NextResponse.json({ message: 'Event created successfully', event: createdEvent }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Event Creation Failed', error: e instanceof Error ? e.message : 'Unknown'}, { status: 500 })
    }
}

/**
 * Fetches all Event documents from the database sorted by creation date (newest first) and returns them in a JSON response.
 *
 * @returns A JSON object with `message` and `events` (array of Event documents) on success; on failure, a JSON object with `message` and `error` (error message string).
 */
export async function GET() {
    try {
        await connectDB();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ message: 'Events fetched successfully', events }, { status: 200 });
    } catch (e) {
        console.error('Event fetching failed:', e);
        return NextResponse.json({ message: 'Event fetching failed', error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
    }
}