package com.syhuinc.omnihub.sleepmode;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.Set;

/**
 * The predefined reminder lines Sleep Mode speaks, keyed by personality and escalation tier
 * (0 = right at bedtime, 3 = maximally persistent). Two pools exist per personality/tier:
 * GENERIC (no name, always eligible) and NAMED (contains exactly one "{name}" placeholder in a
 * safe comma-address position, only mixed in once the user has set a display name in Personal
 * Mode). Splitting it this way means "no personal info" never has to fall back to an awkward
 * substitution — it just draws from a smaller, always-grammatical pool.
 */
public class MessageBank {
    public static final String[] PERSONALITIES = { "gentle", "friendly", "teasing", "strict", "savage" };
    public static final int TIER_COUNT = 4;

    private static final Random RANDOM = new Random();

    // [personality][tier] -> messages
    private static final String[][][] GENERIC = new String[5][TIER_COUNT][];
    private static final String[][][] NAMED = new String[5][TIER_COUNT][];
    // [personality] -> bonus lines mixed in when the user has work/school tomorrow (tier >= 1 only)
    private static final String[][] WORK_TOMORROW = new String[5][];
    // [personality] -> bonus lines mixed in once a wake time is known (tier >= 1 only), uses {wakeTime}
    private static final String[][] WAKE_PROXIMITY = new String[5][];

    private static int idx(String personality) {
        for (int i = 0; i < PERSONALITIES.length; i++) {
            if (PERSONALITIES[i].equals(personality)) return i;
        }
        return 1; // friendly
    }

    static {
        // GENTLE
        GENERIC[0][0] = new String[] {
                "It's about time to rest. Good night.",
                "Bedtime is here. Sweet dreams whenever you're ready.",
                "It's late now. Maybe it's time to close your eyes.",
        };
        NAMED[0][0] = new String[] {
                "{name}, it's about time to rest. Good night.",
                "Hey {name}, it's bedtime. Sweet dreams whenever you're ready.",
        };
        GENERIC[0][1] = new String[] {
                "It's getting later. Your rest matters.",
                "A little more sleep would feel better than a little more scrolling.",
                "Whenever you're ready, bed is right there for you.",
        };
        NAMED[0][1] = new String[] {
                "Still up, {name}? Your pillow's been waiting a while now.",
                "{name}, your rest really does matter.",
        };
        GENERIC[0][2] = new String[] {
                "I really think it's time to put the phone down now.",
                "You'll thank yourself tomorrow if you sleep now.",
                "It's been a while. Let's get you some rest.",
        };
        NAMED[0][2] = new String[] {
                "{name}, I really think it's time to put the phone down now.",
                "Your eyes look like they could use a break, {name}.",
        };
        GENERIC[0][3] = new String[] {
                "Please, just put it down and rest now.",
                "Tomorrow-you is quietly hoping you'll sleep soon.",
                "One last gentle nudge — go to sleep.",
        };
        NAMED[0][3] = new String[] {
                "{name}, please, just put it down and rest now.",
                "I only keep asking because I care, {name}.",
        };
        WORK_TOMORROW[0] = new String[] {
                "You've got somewhere to be tomorrow — your body will thank you for resting now.",
                "Tomorrow's a big day. Let's get you some sleep.",
        };
        WAKE_PROXIMITY[0] = new String[] {
                "Your {wakeTime} alarm will be here before you know it.",
                "You did want to be up by {wakeTime}, remember?",
        };

        // FRIENDLY
        GENERIC[1][0] = new String[] {
                "It's time to sleep. Good night!",
                "Bedtime's here — catch you in the morning.",
                "Alright, that's the signal. Time for bed.",
        };
        NAMED[1][0] = new String[] {
                "Hey {name}, it's time to sleep. Good night!",
                "{name}, lights out time. Sleep well.",
        };
        GENERIC[1][1] = new String[] {
                "It's getting late. Maybe you should sleep.",
                "Your bed's getting a little lonely over there.",
                "You said one more minute about an hour ago.",
        };
        NAMED[1][1] = new String[] {
                "{name}, it's getting late. Maybe you should sleep.",
                "Your pillow is waiting for you, {name}.",
        };
        GENERIC[1][2] = new String[] {
                "Still using your phone? Come on, go to sleep.",
                "Even your battery wants you to go to sleep at this point.",
                "Whatever it is, it'll still be there tomorrow.",
        };
        NAMED[1][2] = new String[] {
                "You're still here, {name}? Come on, go to sleep.",
                "Okay {name}, seriously, this is getting late.",
        };
        GENERIC[1][3] = new String[] {
                "I'm not stopping until you put this thing down.",
                "This is nag number who-knows-what. Sleep. Now.",
                "Put. The phone. Down. Please.",
        };
        NAMED[1][3] = new String[] {
                "{name}, I'm not stopping until you put this thing down.",
                "At this point I'm basically your alarm clock's evil twin, {name}.",
        };
        WORK_TOMORROW[1] = new String[] {
                "Don't forget you've got plans tomorrow. Get some sleep!",
                "Tomorrow's coming whether you've slept or not — might as well sleep.",
        };
        WAKE_PROXIMITY[1] = new String[] {
                "Your {wakeTime} wake-up is getting closer, you know.",
                "{wakeTime} is going to come around fast.",
        };

        // TEASING
        GENERIC[2][0] = new String[] {
                "It's sleep o'clock. Don't test me.",
                "Tuck-in time. I'll be watching.",
                "The scrolling ends now. Probably.",
        };
        NAMED[2][0] = new String[] {
                "Bedtime, {name}. Don't test me.",
                "{name}, tuck-in time. I'll be watching.",
        };
        GENERIC[2][1] = new String[] {
                "Go sleep before I explode from overheating.",
                "Even your battery wants you to go to sleep.",
                "You said one more minute about an hour ago.",
        };
        NAMED[2][1] = new String[] {
                "{name}, go sleep before I explode from overheating.",
                "Your pillow is waiting for you, {name}, and honestly so am I.",
        };
        GENERIC[2][2] = new String[] {
                "Are we really doing this right now?",
                "I've seen glaciers move faster than you putting that phone down.",
                "Your thumb must be tired by now. Let it rest.",
        };
        NAMED[2][2] = new String[] {
                "{name}, are we really doing this right now?",
                "Okay {name}, this is the part where I start judging you a little.",
        };
        GENERIC[2][3] = new String[] {
                "BRO. It's late. What are we doing?",
                "One message away from just yelling 'BEDTIME' on loop.",
                "At this rate sunrise is going to beat you to sleep.",
        };
        NAMED[2][3] = new String[] {
                "{name}. BRO. It's late. What are we doing?",
                "I respect the commitment to chaos, {name}, but please, sleep.",
        };
        WORK_TOMORROW[2] = new String[] {
                "Big day tomorrow and you're still here? Bold strategy.",
                "Tomorrow-you is already filing a complaint about this.",
        };
        WAKE_PROXIMITY[2] = new String[] {
                "Your {wakeTime} alarm is getting closer. Just saying.",
                "Hope you like being tired, because {wakeTime} waits for no one.",
        };

        // STRICT
        GENERIC[3][0] = new String[] {
                "It's time to sleep. Put the phone down.",
                "Bedtime. No excuses.",
                "This is your reminder: sleep now.",
        };
        NAMED[3][0] = new String[] {
                "{name}, it's time to sleep. Put the phone down.",
                "Bedtime, {name}. No excuses.",
        };
        GENERIC[3][1] = new String[] {
                "It's getting late. This isn't a suggestion.",
                "You need to sleep. Put it down.",
                "Enough. Time for bed.",
        };
        NAMED[3][1] = new String[] {
                "{name}, it's getting late. This isn't a suggestion.",
                "This is your second reminder, {name}. Sleep. Now.",
        };
        GENERIC[3][2] = new String[] {
                "I'm not asking again nicely.",
                "Phone down. That's final.",
                "You are actively stealing hours from tomorrow.",
        };
        NAMED[3][2] = new String[] {
                "{name}, I'm not asking again nicely.",
                "This has gone on long enough, {name}. Sleep.",
        };
        GENERIC[3][3] = new String[] {
                "Put the phone down. Right now.",
                "This is not a negotiation. Go to sleep.",
                "Enough is enough. Bed. Now.",
        };
        NAMED[3][3] = new String[] {
                "{name}, put the phone down. Right now.",
                "I will keep saying this until you listen, {name}.",
        };
        WORK_TOMORROW[3] = new String[] {
                "You have somewhere to be tomorrow. Sleep. Now.",
                "Tomorrow is not going to wait for a tired version of you.",
        };
        WAKE_PROXIMITY[3] = new String[] {
                "Your {wakeTime} alarm is not going to feel sorry for you.",
                "{wakeTime} is coming. Sleep is not optional.",
        };

        // SAVAGE
        GENERIC[4][0] = new String[] {
                "It's bedtime. Don't make this weird.",
                "Sleep now, or regret it later. Your call.",
                "Tick tock. Bedtime.",
        };
        NAMED[4][0] = new String[] {
                "{name}, it's bedtime. Don't make this weird.",
                "Tick tock, {name}. Bedtime.",
        };
        GENERIC[4][1] = new String[] {
                "Getting late. Maybe put the phone down before it starts judging you too.",
                "Still up? Bold choice.",
                "That FOMO is writing checks your sleep schedule can't cash.",
        };
        NAMED[4][1] = new String[] {
                "Still up, {name}? Bold choice.",
                "You said 'five more minutes' a lifetime ago, {name}.",
        };
        GENERIC[4][2] = new String[] {
                "You're borrowing sleep from tomorrow now, with interest.",
                "At this point the phone is using you, not the other way around.",
                "Impressive stamina. Terrible decision-making. But impressive.",
        };
        NAMED[4][2] = new String[] {
                "{name}, you're borrowing sleep from tomorrow now, with interest.",
                "Your screen time report is going to need a warning label, {name}.",
        };
        GENERIC[4][3] = new String[] {
                "Wake-up call in a few hours. What are we doing?",
                "Future-you is drafting a formal complaint right now.",
                "Officially run out of nice ways to say this. Sleep.",
        };
        NAMED[4][3] = new String[] {
                "{name}. Wake-up call in a few hours. What are we doing?",
                "BRO. {name}. It's late. Sleep. Immediately.",
        };
        WORK_TOMORROW[4] = new String[] {
                "Tomorrow's going to hit different on zero sleep.",
                "Hope whatever this is was worth it when tomorrow shows up.",
        };
        WAKE_PROXIMITY[4] = new String[] {
                "Your {wakeTime} alarm is going to have zero sympathy for you.",
                "{wakeTime} is closer than your last decision-making skills.",
        };
    }

    public static class Pick {
        public final String text;
        public final String key;

        Pick(String text, String key) {
            this.text = text;
            this.key = key;
        }
    }

    /**
     * Picks one message for the given personality/tier, avoiding anything in recentKeys when
     * possible. Falls back to the full candidate pool (allowing a repeat) only once every
     * candidate has already been used recently, so the cycle never runs dry mid-night.
     */
    public static Pick pick(
            String personality,
            int tier,
            String displayName,
            boolean hasWorkTomorrow,
            String wakeTimeLabel,
            Set<String> recentKeys
    ) {
        int p = idx(personality);
        int t = Math.max(0, Math.min(TIER_COUNT - 1, tier));
        boolean named = displayName != null && !displayName.trim().isEmpty();

        List<String[]> pools = new ArrayList<>();
        List<String> prefixes = new ArrayList<>();

        pools.add(GENERIC[p][t]);
        prefixes.add("g" + t);
        if (named) {
            pools.add(NAMED[p][t]);
            prefixes.add("n" + t);
        }
        if (t >= 1 && hasWorkTomorrow && WORK_TOMORROW[p] != null) {
            pools.add(WORK_TOMORROW[p]);
            prefixes.add("w");
        }
        if (t >= 1 && wakeTimeLabel != null && WAKE_PROXIMITY[p] != null) {
            pools.add(WAKE_PROXIMITY[p]);
            prefixes.add("k");
        }

        List<String> candidateKeys = new ArrayList<>();
        List<String> candidateTexts = new ArrayList<>();
        for (int i = 0; i < pools.size(); i++) {
            String[] pool = pools.get(i);
            for (int j = 0; j < pool.length; j++) {
                candidateKeys.add(personality + ":" + prefixes.get(i) + ":" + j);
                candidateTexts.add(pool[j]);
            }
        }

        List<Integer> fresh = new ArrayList<>();
        for (int i = 0; i < candidateKeys.size(); i++) {
            if (!recentKeys.contains(candidateKeys.get(i))) fresh.add(i);
        }
        List<Integer> pickFrom = fresh.isEmpty() ? allIndices(candidateKeys.size()) : fresh;
        int chosen = pickFrom.get(RANDOM.nextInt(pickFrom.size()));

        String text = candidateTexts.get(chosen)
                .replace("{name}", displayName == null ? "" : displayName.trim())
                .replace("{wakeTime}", wakeTimeLabel == null ? "" : wakeTimeLabel);
        return new Pick(text, candidateKeys.get(chosen));
    }

    private static List<Integer> allIndices(int n) {
        List<Integer> all = new ArrayList<>();
        for (int i = 0; i < n; i++) all.add(i);
        return all;
    }
}
