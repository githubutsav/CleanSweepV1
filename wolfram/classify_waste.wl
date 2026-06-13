categorizeWaste[identified_] := Module[
  {name = ToLowerCase[ToString[identified]]},
  Which[
    StringContainsQ[name, "plastic" | "bottle" | "container" | "bag" | "wrapper" | "styrofoam"],
      "Plastic",
    StringContainsQ[name, "paper" | "cardboard" | "newspaper" | "carton"],
      "Paper & Cardboard",
    StringContainsQ[name, "metal" | "aluminum" | "can" | "tin" | "iron" | "steel"],
      "Metal",
    StringContainsQ[name, "glass" | "jar" | "mirror"],
      "Glass",
    StringContainsQ[name, "food" | "fruit" | "vegetable" | "organic" | "leaf" | "wood" | "plant"],
      "Organic / Biodegradable",
    StringContainsQ[name, "electronic" | "phone" | "computer" | "wire" | "cable" | "battery" | "circuit"],
      "E-Waste",
    StringContainsQ[name, "textile" | "cloth" | "fabric" | "shoe" | "clothing"],
      "Textile",
    StringContainsQ[name, "rubber" | "tire" | "tyre"],
      "Rubber",
    StringContainsQ[name, "medical" | "syringe" | "mask" | "glove" | "bandage"],
      "Medical / Hazardous",
    StringContainsQ[name, "construction" | "concrete" | "brick" | "debris"],
      "Construction Debris",
    True,
      "Mixed / General Waste"
  ]
];

assessSeverity[category_] := Switch[category,
  "Medical / Hazardous", 5,
  "E-Waste",             4,
  "Construction Debris", 4,
  "Plastic",             3,
  "Metal",               3,
  "Glass",               3,
  "Paper & Cardboard",   2,
  "Textile",             2,
  "Rubber",              3,
  "Organic / Biodegradable", 1,
  _,                     2
];

isRecyclable[category_] := Switch[category,
  "Plastic",                  True,
  "Paper & Cardboard",        True,
  "Metal",                    True,
  "Glass",                    True,
  "E-Waste",                  True,  
  "Textile",                  True,  
  "Organic / Biodegradable",  True,  
  "Rubber",                   False,
  "Medical / Hazardous",      False,
  "Construction Debris",      False,
  _,                          False
];

decompositionTime[category_] := Switch[category,
  "Plastic",                  "450 years",
  "Paper & Cardboard",        "2-6 weeks",
  "Metal",                    "200-500 years",
  "Glass",                    "1 million years",
  "E-Waste",                  "1 million years+",
  "Textile",                  "1-5 months (natural) / 200 years (synthetic)",
  "Rubber",                   "50-80 years",
  "Organic / Biodegradable",  "1-6 months",
  "Medical / Hazardous",      "Varies — requires incineration",
  "Construction Debris",      "Centuries (non-biodegradable)",
  _,                          "Unknown"
];

severityLabel[score_] := Switch[score,
  1, "Low",
  2, "Moderate",
  3, "High",
  4, "Very High",
  5, "Critical",
  _, "Unknown"
];

classifyWasteAPI = APIFunction[
  {"image" -> "Image"},
  Module[
    {identified, category, severity, recyclable, decompTime},

    identified = ImageIdentify[#image, All, 3];

    category = categorizeWaste[First[Keys[identified]]];

    severity = assessSeverity[category];
    recyclable = isRecyclable[category];
    decompTime = decompositionTime[category];

    <|
      "category"          -> category,
      "severity"          -> severityLabel[severity],
      "severityScore"     -> severity,
      "recyclable"        -> recyclable,
      "decompositionTime" -> decompTime,
      "rawIdentification" -> ToString[First[Keys[identified]]],
      "confidence"        -> First[Values[identified]],
      "poweredBy"         -> "Wolfram — ImageIdentify + Knowledge Base"
    |>
  ] &,
  "JSON"  
];

CloudDeploy[classifyWasteAPI, "CleanSweepClassify", Permissions -> "Public"]
