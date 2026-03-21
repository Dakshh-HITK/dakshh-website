import { NextResponse } from "next/server";
import connect from "@/lib/mongoose";
import EventResult from "@/lib/models/EventResult";
import Event from "@/lib/models/Events";
import SiteSettings from "@/lib/models/SiteSettings";

export async function GET() {
  try {
    await connect();

    const visibilitySetting = await SiteSettings.findOne({
      key: "resultsPageEnabled",
    }).lean();
    const isEnabled =
      visibilitySetting == null
        ? true
        : (visibilitySetting as Record<string, unknown>).value !== false;

    if (!isEnabled) {
      return NextResponse.json({ hidden: true, results: [] });
    }

    const [results, roboDangalEvent] = await Promise.all([
      EventResult.find({ isPublished: true })
        .sort({ publishedAt: -1, updatedAt: -1 })
        .lean(),
      Event.findOne({ eventName: /Robo Dangal/i })
        .select("banner category prizePool")
        .lean(),
    ]);

    const eventIds = [
      ...new Set(
        results
          .map((r) => String((r as Record<string, unknown>).eventId ?? ""))
          .filter(Boolean)
      ),
    ];
    const events = await Event.find({ _id: { $in: eventIds } })
      .select("prizePool")
      .lean();
    const prizePoolByEventId = new Map<string, string | null>();
    for (const e of events) {
      const eAny = e as { _id: unknown; prizePool?: string };
      const val = eAny.prizePool ?? null;
      if (val && String(val).trim() !== "" && String(val).toLowerCase() !== "tbd") {
        prizePoolByEventId.set(String(eAny._id), val);
      }
    }

    const mappedResults = results.map((r) => {
      const rAny = r as Record<string, unknown>;
      const eid = String(rAny.eventId ?? "");
      return {
        eventId: eid,
        eventName: rAny.eventName ?? "",
        eventBanner: rAny.eventBanner ?? null,
        eventCategory: rAny.eventCategory ?? null,
        eventPrizePool: prizePoolByEventId.get(eid) ?? null,
        entries: rAny.entries ?? [],
        publishedAt: rAny.publishedAt ?? rAny.updatedAt ?? null,
      };
    });

    const eAny = roboDangalEvent as { banner?: string; category?: string; prizePool?: string } | null;
    const roboDangalEventInfo =
      eAny != null
        ? {
            banner: eAny.banner ?? null,
            category: eAny.category ?? null,
            prizePool:
              eAny.prizePool && String(eAny.prizePool).trim() !== "" && String(eAny.prizePool).toLowerCase() !== "tbd"
                ? eAny.prizePool
                : null,
          }
        : null;

    return NextResponse.json({
      results: mappedResults,
      roboDangalEvent: roboDangalEventInfo,
    });
  } catch (err) {
    console.error("Public results fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
