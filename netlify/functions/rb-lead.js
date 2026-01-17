import { createClient } from "@supabase/supabase-js";

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
  return headers["x-nf-client-connection-ip"] || "";
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
    source_page: headers.referer || "",
    user_agent: headers["user-agent"] || "",
    ip: getIp(headers),
    created_at: new Date().toISOString(),
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: "Method Not Allowed" }),
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Server not configured (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing).",
      }),
    };
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: "Invalid JSON payload." }),
    };
  }

  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length > 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: `Missing required fields: ${missing.join(", ")}.`,
      }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const insertPayload = normalizePayload(payload, event.headers || {});

  const { data, error } = await supabase
    .from("rb_leads")
    .insert([insertPayload])
    .select("id")
    .single();

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message || "Failed to write to Supabase.",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      leadId: data?.id || null,
    }),
  };
}
