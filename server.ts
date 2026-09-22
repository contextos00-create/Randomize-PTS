import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini AI
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// API: AI Assistance for Pts.js coding, mathematics, and variable synthesis
app.post("/api/ai-help", async (req, res) => {
  try {
    const { prompt, currentCode, engine, variables } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    // Check if API key is provided
    if (!process.env.GEMINI_API_KEY) {
      // Provide an intelligent offline fallback response with complete code & variable definitions
      return res.json({
        response: `### Pts.js Generative Function Suggestion

Here is a custom low-level Pts.js harmonic field function with dynamic parameters:

\`\`\`javascript
// Custom Organic Vector Swirl Kernel
// @param {slider} name="Swirl Tension" key="swirlTension" min=0.2 max=4 val=1.8 cat="physics"
// @param {slider} name="Vortex Radius" key="vortexRadius" min=40 max=300 val=120 cat="function"
// @param {color} name="Resonance Glow" key="resonanceGlow" val="#0ea5e9" cat="look"

function customPtsKernel(form, space, time, v, pointer) {
  const center = space.center;
  const radius = v.vortexRadius || 120;
  const tension = v.swirlTension || 1.8;
  const glow = v.resonanceGlow || '#0ea5e9';
  
  const ring = Group.make(16, (i) => {
    const angle = (i / 16) * Math.PI * 2 + time * 0.5;
    const r = radius + Math.sin(angle * 3 + time * tension) * (radius * 0.3);
    return center.$add(new Pt(Math.cos(angle) * r, Math.sin(angle) * r));
  });

  const smoothRing = Curve.catmullRom(ring, 8);
  form.stroke(glow, 2.5).line(smoothRing);
  
  if (pointer && pointer.x > 0) {
    form.stroke("rgba(14, 165, 233, 0.4)", 1).line([center, pointer]);
  }
}
\`\`\`

*(Note: Set \`GEMINI_API_KEY\` in your environment settings for real-time live model responses).*`,
        suggestedCode: `// Custom Organic Vector Swirl Kernel
// @param {slider} name="Swirl Tension" key="swirlTension" min=0.2 max=4 val=1.8 cat="physics"
// @param {slider} name="Vortex Radius" key="vortexRadius" min=40 max=300 val=120 cat="function"
// @param {color} name="Resonance Glow" key="resonanceGlow" val="#0ea5e9" cat="look"

function renderCustomEffect(form, space, time, v, pointer) {
  const center = space.center;
  const radius = v.vortexRadius || 120;
  const tension = v.swirlTension || 1.8;
  const glow = v.resonanceGlow || '#0ea5e9';
  
  const ring = Group.make(18, (i) => {
    const angle = (i / 18) * Math.PI * 2 + time * 0.5;
    const r = radius + Math.sin(angle * 3 + time * tension) * (radius * 0.35);
    return center.$add(new Pt(Math.cos(angle) * r, Math.sin(angle) * r));
  });

  const smooth = Curve.catmullRom(ring, 6);
  form.stroke(glow, 2).line(smooth);
}`,
        extractedVariables: [
          {
            name: "Swirl Tension",
            key: "swirlTension",
            type: "slider",
            min: 0.2,
            max: 4,
            step: 0.1,
            value: 1.8,
            category: "physics",
            unit: "",
          },
          {
            name: "Vortex Radius",
            key: "vortexRadius",
            type: "slider",
            min: 40,
            max: 300,
            step: 5,
            value: 120,
            category: "function",
            unit: "px",
          },
          {
            name: "Resonance Glow",
            key: "resonanceGlow",
            type: "color",
            value: "#0ea5e9",
            category: "look",
          },
        ],
      });
    }

    const ai = getAI();
    const systemInstruction = `You are an elite creative coding expert and mathematical artist specializing in Pts.js (an expressive canvas visualization library).
Your role is to assist the user in writing low-level Pts.js functions and creating dynamic variables for their interactive visualization randomizer.

Pts.js classes available:
- Pt (2D/ND vector: $add, $subtract, $multiply, unit, magnitude, toAngle, angle, rotate2D)
- Group (array of Pt: Group.fromArray, Group.make)
- Curve (Curve.catmullRom, Curve.bezier, Curve.bspline)
- Geom (Geom.interpolate, Geom.withinBound)
- Circle (Circle.fromCenter, Circle.radius, Circle.intersectCircle2D)
- Triangle (Triangle.circumcircle, Triangle.medials)
- Polygon (Polygon.centroid, Polygon.lines)
- form: CanvasForm (form.stroke(color, width), form.fill(color), form.line(pts), form.circle(c), form.polygon(p), form.point(pt, r, 'circle'))
- space: CanvasSpace (space.size, space.center, space.width, space.height)

When the user asks for code, provide functional, high-performance Pts.js functions.
You must also define dynamic parameters using this comment syntax right above the function:
// @param {slider} name="Parameter Name" key="paramKey" min=0 max=100 val=50 cat="physics|function|look|attributes"
// @param {color} name="Glow Color" key="glowColor" val="#ff0055" cat="look"
// @param {toggle} name="Draw Trails" key="drawTrails" val=true cat="attributes"

Keep the response concise, artsy, and directly runnable.`;

    const modelName = "gemini-3.1-pro-preview";

    const promptMessage = `User Request: ${prompt}

Current Visualization Engine: ${engine || "particle_swarm"}
Current Dynamic Variables Count: ${Array.isArray(variables) ? variables.length : 0}
Current Code (if any):
${currentCode || "None provided yet."}

Please generate the Pts.js function and parameter declarations.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: promptMessage,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const text = response.text || "";

    // Extract any code block from the response
    const codeMatch = text.match(/```(?:javascript|typescript|js|ts)?\n([\s\S]*?)```/);
    const suggestedCode = codeMatch ? codeMatch[1].trim() : "";

    // Parse parameters from code if found
    const extractedVariables: any[] = [];
    if (suggestedCode) {
      const paramRegex = /\/\/\s*@param\s*\{([^}]+)\}\s*name="([^"]+)"\s*key="([^"]+)"(?:\s*min=([0-9.-]+))?(?:\s*max=([0-9.-]+))?(?:\s*step=([0-9.-]+))?\s*val=([^\s]+)\s*cat="([^"]+)"/g;
      let m;
      while ((m = paramRegex.exec(suggestedCode)) !== null) {
        const type = m[1].toLowerCase();
        const name = m[2];
        const key = m[3];
        const min = m[4] ? parseFloat(m[4]) : undefined;
        const max = m[5] ? parseFloat(m[5]) : undefined;
        const step = m[6] ? parseFloat(m[6]) : undefined;
        let value: any = m[7];
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        else if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(Number(value))) value = Number(value);
        const category = m[8] || 'function';

        extractedVariables.push({
          name,
          key,
          type: type === 'color' ? 'color' : type === 'toggle' ? 'toggle' : 'slider',
          min,
          max,
          step,
          value,
          category,
          unit: "",
        });
      }
    }

    res.json({
      response: text,
      suggestedCode,
      extractedVariables,
    });
  } catch (err: any) {
    console.error("AI Help API error:", err);
    res.status(500).json({
      error: err.message || "Failed to generate AI response",
    });
  }
});

// Vite middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pts.js Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
