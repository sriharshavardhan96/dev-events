import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import {cacheLife} from "next/cache";
import { IEvent } from "@/database/event.model";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const Page = async () => {
    'use cache';
    cacheLife('hours');
    let events = [];
    try {
        const response = await fetch(`${BASE_URL}/api/events`);
        if (!response.ok) {
            throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (data && Array.isArray(data.events)) {
            events = data.events;
        } else {
            console.error('Invalid events data structure received:', data);
            // Fallback to empty array
        }
    } catch (error) {
        // Log detailed error for debugging
        console.error('Error loading events:', error instanceof Error ? error.message : error);
        // events remains empty array, gracefully degrading
    }

    return (
        <section>
            <h1 className="text-center">The Hub for Every Dev <br /> Event You Can&apos;t Miss</h1>
            <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

            <ExploreBtn />

            <div className="mt-20 space-y-7">
                <h3>Featured Events</h3>

                <ul className="events">
                    {events && events.length > 0 && events.map((event: IEvent) => (
                        <li key={event._id?.toString()} className="list-none">
                            <EventCard {...event} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

export default Page;