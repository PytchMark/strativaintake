import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import supabase from "./services/supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

const REQUIRED_FIELDS = [
  "fullName",
  "primaryPhone",
  "preferredChannel",
  "parish",
  "rebuildType",
  "estimatedBudget",
  "monthlyPayment",
];

function getIp(headers = {}) {
  const forwarded = headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headers["x-real-ip"] || "";
}

function getSourcePage(headers = {}) {
  return headers.referer || headers.origin || "";
}

function normalizePayload(body, headers) {
  return {
    full_name: body.fullName || "",
    primary_phone: body.primaryPhone || "",
    email: body.email || "",
    preferred_channel: body.preferredChannel || "",
    hear_about_us: body.hearAboutUs || "",
    parish: body.parish || "",
    community: body.community || "",
    property_status: body.propertyStatus || "",
    rebuild_type: body.rebuildType || "",
    hurricane_impact_level: body.hurricaneImpactLevel || null,
    project_priority: body.projectPriority || null,
    estimated_budget: body.estimatedBudget || null,
    monthly_payment: body.monthlyPayment || null,
    start_timeline_months: body.startTimelineMonths || null,
    nht_contributor: body.nhtContributor || "",
    employment_type: body.employmentType || "",
    nht_product: body.nhtProduct || "",
    other_financing: body.otherFinancing || "",
    income_range: body.incomeRange || "",
    overseas_sponsor: body.overseasSponsor || "",
    sponsor_country: body.sponsorCountry || "",
    willing_visit: body.willingVisit || "",
    visit_window: body.visitWindow || "",
    source_page: getSourcePage(headers),
    user_agent: headers["user-agent"] || "",
    ip: getIp(headers),
    created_at: new Date().toISOString(),
  };
}

app.post("/api/rb/lead", async (req, res) => {
  const payload = req.body || {};
  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Missing required fields: ${missing.join(", ")}.`,
    });
  }

  const insertPayload = normalizePayload(payload, req.headers);

  const { data, error } = await supabase
    .from("rb_leads")
    .insert([insertPayload])
    .select("id")
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to write to Supabase.",
    });
  }

  return res.json({
    success: true,
    leadId: data?.id || null,
  });
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => console.log(`Running on port ${port}`));
