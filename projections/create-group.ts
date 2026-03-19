import { GROUP, STREAM } from "../constants/redis-stream";
import { redis } from "../shared/database/redis";

export async function createGroup(streamName: typeof STREAM, groupName: typeof GROUP) {
    await redis.xgroup(
        "CREATE",
        streamName,
        groupName,
        "0",
        "MKSTREAM"
    );
}

