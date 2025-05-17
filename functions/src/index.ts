/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Use genkit object approach
import {genkit} from "genkit";
// import { firebase } from "@genkit-ai/firebase"; // Removed firebase plugin for now
import {googleAI, gemini10Pro} from "@genkit-ai/googleai";
// import { openAI, gpt4o } from "genkitx-openai"; // OpenAI removed for testing
import * as z from "zod";

admin.initializeApp();

// Modified AdGenInputSchema: provider is now optional and defaults to gemini
const AdGenInputSchema = z.object({
  alertDetails: z.object({ // Basic alert structure - adjust as needed
    properties: z.object({
      event: z.string().optional().default("Weather Event"),
      areaDesc: z.string().optional().default("the local area"),
      severity: z.string().optional().default("Unknown"),
      description: z.string().optional().default(""),
    }).optional().default({}),
  }).optional().default({properties: {}}),
  userSettings: z.object({ // Basic user settings - adjust as needed
    companyName: z.string().optional(),
    businessType: z.string().optional().default("local business"),
    contactPhone: z.string().optional(),
    companyWebsite: z.string().optional(),
    // Add other settings if needed (branding, ad preferences)
  }).optional().default({}),
  provider: z.enum(["gemini", "openai"]).optional().default("gemini"), // Made optional, default gemini
});

// Define the output schema for the flow
const AdGenOutputSchema = z.object({
  headlines: z.array(z.string()),
  body: z.string(),
  imageUrl: z.string(), // Keeping mock image URL for now
});

// Define flow directly using genkit import (assuming it provides defineFlow)
const adGenFlow = genkit.defineFlow( 
  {
    name: "adGenerationFlow",
    inputSchema: AdGenInputSchema,
    outputSchema: AdGenOutputSchema,
  },
  async (input: z.infer<typeof AdGenInputSchema>) => { 
    // Initialize Genkit inside the flow
    const ai = genkit({
      plugins: [
        googleAI({ apiKey: process.env.GOOGLEAI_KEY }),
      ],
    });
    
    logger.info("Starting ad generation flow with input:", input);
    const { alertDetails, userSettings } = input; 
    const alertProps = alertDetails.properties || {};
    const model = gemini10Pro;
    logger.info(`Using model: ${model.name}`);
    const businessName = userSettings.companyName || "Our company";
    const businessType = userSettings.businessType || "local business";
    const contactString = userSettings.contactPhone ? 
      `Call ${userSettings.contactPhone}` :
      userSettings.companyWebsite ? 
        `Visit ${userSettings.companyWebsite}` :
        "Contact us for details.";

    const headlinePrompt = 
      `Generate exactly 3 distinct ad headlines for a marketing campaign. The company is ${businessName}, a ${businessType}. The ad is responding to a ${alertProps.event || "weather alert"} affecting ${alertProps.areaDesc || "the area"} (Severity: ${alertProps.severity || "Unknown"}). Each headline must be 90 characters or less, end with a period, and include a call to action like 'Learn More', 'Call Us', 'Get a Quote', 'Visit Website'.`;
    const bodyPrompt = 
      `Generate marketing ad body copy. The company is ${businessName}. The ad is responding to a ${alertProps.event || "weather alert"}. The official alert description is: "${alertProps.description || "Details not available"}". The tone should be helpful and reassuring, not alarmist. Start the copy with "Weather Notice:" or similar. Include this contact info or call to action: ${contactString}. The entire copy must be 180 characters or less.`;

    logger.info("Generating headlines...");
    const headlineResponse = await ai.generate({ 
      model: model,
      prompt: headlinePrompt,
      config: { temperature: 0.7 },
      output: { schema: z.array(z.string()).length(3) },
    });
    
    const headlines = headlineResponse?.output || [
        `Headline generation failed...`,
        `Default Headline 2...`,
        `Contact ${businessName}...`,
    ];
    logger.info("Generated headlines:", headlines);

    logger.info("Generating body copy...");
    const bodyResponse = await ai.generate({ 
      model: model,
      prompt: bodyPrompt,
      config: { temperature: 0.6 },
    });
    const body = bodyResponse?.text || `Weather Notice: ...`;
    logger.info("Generated body:", body);

    const imageUrl = `https://picsum.photos/seed/...`;

    const result = {
      headlines: headlines.map((h: string) => h.substring(0, 90)), 
      body: body.substring(0, 180), 
      imageUrl: imageUrl,
    };
    logger.info("Flow completed successfully. Result:", result);
    return result;
  }
);

// Define the Firebase Callable Function
export const generateAdContent = onCall({secrets: ["GOOGLEAI_KEY"]}, async (request) => { // Removed OPENAI_KEY from secrets
  logger.info("Received generateAdContent request", {data: request.data});

  // Validate input using the Zod schema
  const validationResult = AdGenInputSchema.safeParse(request.data);
  if (!validationResult.success) {
    logger.error("Invalid request data:", validationResult.error.issues);
    throw new HttpsError(
      "invalid-argument",
      `Invalid request data: ${validationResult.error.message}`
    );
  }

  const validatedData = validationResult.data;

  try {
    logger.info("Running adGenFlow (Google AI only test)");
    // Run the Genkit flow using the flow object
    const result = await adGenFlow.run(validatedData);
    logger.info("adGenFlow completed, returning result:", result);
    return result;
  } catch (error: any) {
    logger.error("Error executing adGenFlow:", error);
    // Provide a more generic error message to the client
    let message = "Failed to generate ad content.";
    // Type check before accessing properties
    if (error instanceof Error) {
      message = error.message;
    }
    throw new HttpsError(
      "internal",
      "Failed to generate ad content.",
      message // Send potentially more specific message
    );
  }
});
