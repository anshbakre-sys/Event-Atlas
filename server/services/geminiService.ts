import { GoogleGenAI, Type } from '@google/genai';
import { EventService } from './eventService.ts';
import type { EventFilterCriteria, NormalizedEvent } from '../utils/eventFilter.ts';

// Server-side initialization
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return aiClient;
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

export interface AssistantParsedCriteria {
  categories?: string[];
  searchQuery?: string;
  cities?: string[];
  budget?: number;
  startDate?: string;
  endDate?: string;
  nearMe?: boolean;
  platforms?: string[];
  explanationPrompt?: string;
}

export interface AssistantResponse {
  answer: string;
  criteria: AssistantParsedCriteria;
  events: NormalizedEvent[];
  totalMatches: number;
  grounded: boolean;
  appliedCities: string[];
}

export class GeminiService {
  /**
   * Parse natural-language prompt and query real events
   */
  public static async searchEventsWithAI(
    userPrompt: string,
    context: {
      userAge?: number | null;
      userLat?: number;
      userLng?: number;
      currentCity?: string;
    }
  ): Promise<AssistantResponse> {
    const parsedCriteria = await this.parsePromptWithGemini(userPrompt, context);

    // Build database search criteria
    const searchFilter: EventFilterCriteria = {
      searchQuery: parsedCriteria.searchQuery,
      categories: parsedCriteria.categories,
      budget: parsedCriteria.budget,
      startDate: parsedCriteria.startDate,
      endDate: parsedCriteria.endDate,
      userAge: context.userAge,
      userLat: context.userLat,
      userLng: context.userLng,
      platforms: parsedCriteria.platforms,
    };

    // If specific cities were mentioned, filter by those cities
    if (parsedCriteria.cities && parsedCriteria.cities.length > 0) {
      searchFilter.cities = parsedCriteria.cities;
    } else if (parsedCriteria.nearMe && context.currentCity) {
      searchFilter.cities = [context.currentCity];
    }

    // Query real events from MongoDB / catalog
    const { events } = await EventService.getEvents(searchFilter);

    // Generate grounded explanation
    const explanation = await this.generateGroundedExplanation(userPrompt, parsedCriteria, events, searchFilter);

    return {
      answer: explanation,
      criteria: parsedCriteria,
      events,
      totalMatches: events.length,
      grounded: true,
      appliedCities: searchFilter.cities || [],
    };
  }

  /**
   * Use gemini-3.8-flash with structured JSON responseSchema to parse the query
   */
  private static async parsePromptWithGemini(
    prompt: string,
    context: { currentCity?: string; userAge?: number | null }
  ): Promise<AssistantParsedCriteria> {
    const ai = getAIClient();

    if (!ai) {
      // Fallback rule-based parser if API key is not present
      return this.ruleBasedQueryParser(prompt, context);
    }

    try {
      const today = new Date();
      const currentYear = today.getFullYear();
      const systemInstruction = `You are the Event Atlas natural-language query parser.
Analyze the user's event request and extract structured criteria.
Current date reference: ${today.toISOString()} (Year ${currentYear}).
Default country: India. Cities commonly include Indore, Mumbai, Delhi, Bengaluru, Pune.
If the user specifies a date like "before 20 December", convert to ISO 8601 string for Year ${currentYear} e.g. "${currentYear}-12-20T23:59:59.000Z".
If the user specifies a budget like "1000", "₹1,000", extract the number (e.g. 1000).
If the user says "near me", set nearMe to true.
Map event types to standard categories:
- Rock music events
- Music concerts
- Live music
- Stand-up comedy
- Cultural events
- Theatre and performances
- Festivals
- Hackathons
- Technology meetups
- Workshops
- Conferences
- Networking events`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              categories: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Relevant standard event categories',
              },
              searchQuery: {
                type: Type.STRING,
                description: 'Specific artist, keywords, or topics mentioned',
              },
              cities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Allowed or requested cities (e.g. ["Indore", "Mumbai", "Delhi"])',
              },
              budget: {
                type: Type.NUMBER,
                description: 'Maximum ticket budget in INR',
              },
              startDate: {
                type: Type.STRING,
                description: 'Earliest ISO 8601 date timestamp',
              },
              endDate: {
                type: Type.STRING,
                description: 'Latest ISO 8601 date timestamp',
              },
              nearMe: {
                type: Type.BOOLEAN,
                description: 'Whether the user requested nearby events',
              },
              platforms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Specific platforms requested (District, BookMyShow, Luma)',
              },
            },
          },
        },
      });

      const text = response.text?.trim();
      if (text) {
        const parsed = JSON.parse(text) as AssistantParsedCriteria;
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini query parsing failed, falling back to rule-based parser:', err);
    }

    return this.ruleBasedQueryParser(prompt, context);
  }

  /**
   * Deterministic rule-based query parser (handles example queries even if offline)
   */
  private static ruleBasedQueryParser(
    prompt: string,
    context: { currentCity?: string }
  ): AssistantParsedCriteria {
    const lower = prompt.toLowerCase();
    const criteria: AssistantParsedCriteria = {};

    // Check categories
    if (lower.includes('rock')) {
      criteria.categories = ['Rock music events'];
    } else if (lower.includes('comedy') || lower.includes('standup') || lower.includes('stand-up')) {
      criteria.categories = ['Stand-up comedy'];
    } else if (lower.includes('hackathon')) {
      criteria.categories = ['Hackathons'];
    } else if (lower.includes('tech') || lower.includes('developer') || lower.includes('meetup')) {
      criteria.categories = ['Technology meetups'];
    } else if (lower.includes('conference')) {
      criteria.categories = ['Conferences'];
    } else if (lower.includes('theatre') || lower.includes('drama') || lower.includes('play')) {
      criteria.categories = ['Theatre and performances'];
    } else if (lower.includes('classical') || lower.includes('cultural') || lower.includes('folk')) {
      criteria.categories = ['Cultural events'];
    } else if (lower.includes('live music') || lower.includes('concert') || lower.includes('gig')) {
      criteria.categories = ['Live music', 'Music concerts'];
    }

    // Check budget e.g. "budget is ₹1,000" or "under 1000" or "below 500"
    const budgetMatch = lower.match(/(?:budget\s*(?:is)?\s*₹?\s*|under\s*₹?\s*|below\s*₹?\s*|less\s*than\s*₹?\s*|₹\s*)(\d[\d,]*)/);
    if (budgetMatch && budgetMatch[1]) {
      const num = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(num)) criteria.budget = num;
    }

    // Check cities
    const targetCities: string[] = [];
    const knownCities = ['Indore', 'Mumbai', 'Delhi', 'Bengaluru', 'Bangalore', 'Pune'];
    for (const city of knownCities) {
      if (lower.includes(city.toLowerCase())) {
        targetCities.push(city === 'Bangalore' ? 'Bengaluru' : city);
      }
    }
    if (targetCities.length > 0) {
      criteria.cities = targetCities;
    }

    // Check "near me"
    if (lower.includes('near me') || lower.includes('nearby') || lower.includes('around me')) {
      criteria.nearMe = true;
    }

    // Check date e.g. "before 20 December"
    const currentYear = new Date().getFullYear();
    const beforeDateMatch = lower.match(/before\s+(\d{1,2})\s+([a-zA-Z]+)/);
    if (beforeDateMatch) {
      const day = parseInt(beforeDateMatch[1], 10);
      const monthStr = beforeDateMatch[2].toLowerCase();
      const monthMap: Record<string, number> = {
        jan: 0, january: 0,
        feb: 1, february: 1,
        mar: 2, march: 2,
        apr: 3, april: 3,
        may: 4,
        jun: 5, june: 5,
        jul: 6, july: 6,
        aug: 7, august: 7,
        sep: 8, september: 8,
        oct: 9, october: 9,
        nov: 10, november: 10,
        dec: 11, december: 11,
      };
      if (monthMap[monthStr] !== undefined) {
        const d = new Date(Date.UTC(currentYear, monthMap[monthStr], day, 23, 59, 59));
        criteria.endDate = d.toISOString();
      }
    }

    // Platforms
    const platforms: string[] = [];
    if (lower.includes('district') || lower.includes('zomato')) platforms.push('District');
    if (lower.includes('bookmyshow') || lower.includes('bms')) platforms.push('BookMyShow');
    if (lower.includes('luma') || lower.includes('lu.ma')) platforms.push('Luma');
    if (platforms.length > 0) criteria.platforms = platforms;

    return criteria;
  }

  /**
   * Generate an accurate, non-hallucinatory grounded summary
   */
  private static async generateGroundedExplanation(
    prompt: string,
    criteria: AssistantParsedCriteria,
    matchedEvents: NormalizedEvent[],
    filter: EventFilterCriteria
  ): Promise<string> {
    const ai = getAIClient();

    // Prepare human-readable context summary
    const budgetStr = criteria.budget !== undefined ? `within ₹${criteria.budget.toLocaleString('en-IN')}` : '';
    const dateStr = criteria.endDate ? `before ${new Date(criteria.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}` : '';
    const citiesStr = criteria.cities && criteria.cities.length > 0 ? criteria.cities.join(', ') : criteria.nearMe ? 'your nearby area' : 'all locations';
    const categoryStr = criteria.categories?.join(', ') || 'events';

    if (matchedEvents.length === 0) {
      return `I searched Event Atlas across ${citiesStr} for ${categoryStr}${budgetStr ? ` ${budgetStr}` : ''}${dateStr ? ` ${dateStr}` : ''}, but found no verified events matching all those criteria. You can adjust your budget ceiling or date range to explore more options on the map.`;
    }

    if (ai) {
      try {
        const eventSummaries = matchedEvents.map((e) => ({
          title: e.title,
          city: e.city,
          venue: e.venueName,
          date: new Date(e.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          startingPrice: e.startingPrice === 0 ? 'Free' : `₹${e.startingPrice}`,
          source: e.source,
        }));

        const promptText = `User asked: "${prompt}"
Verified database results found:
${JSON.stringify(eventSummaries, null, 2)}

Provide a concise, direct, helpful 2-4 sentence summary of what was found across the requested cities and criteria. State exact venues and ticket prices truthfully. Do not invent any event or detail not present in the results above.`;

        const resp = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
        });

        if (resp.text?.trim()) {
          return resp.text.trim();
        }
      } catch (e) {
        // Fallback to template if generation fails
      }
    }

    // Deterministic grounded response template
    const citiesFound = Array.from(new Set(matchedEvents.map((e) => e.city))).join(', ');
    return `Found ${matchedEvents.length} ${categoryStr} ${budgetStr} ${dateStr} across ${citiesFound}. Featured options include "${matchedEvents[0].title}" in ${matchedEvents[0].city} (₹${matchedEvents[0].startingPrice}) and "${matchedEvents[1]?.title || matchedEvents[0].title}". You can click below to view these on the interactive map.`;
  }
}
