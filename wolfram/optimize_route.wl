optimizeRouteAPI = APIFunction[
  {"locations" -> "String"},
  Module[
    {parsed, geoPoints, ids, tour, orderedIds, 
     totalDistance, tourPath, orderedCoords},

    parsed = ImportString[#locations, "JSON"];

    If[Length[parsed] < 2,
      Return[
        <|
          "error" -> "Need at least 2 locations to optimize a route",
          "count" -> Length[parsed]
        |>
      ]
    ];

    geoPoints = GeoPosition[{#["lat"], #["lon"]}] & /@ parsed;
    ids = #["id"] & /@ parsed;

    tour = FindShortestTour[geoPoints];

    tourPath = tour[[2]];

    orderedIds = ids[[#]] & /@ tourPath;

    totalDistance = Total[
      Table[
        QuantityMagnitude[
          GeoDistance[
            geoPoints[[ tourPath[[i]] ]], 
            geoPoints[[ tourPath[[i + 1]] ]]
          ],
          "Kilometers"
        ],
        {i, Length[tourPath] - 1}
      ]
    ];

    orderedCoords = Table[
      <|
        "id"  -> ids[[ tourPath[[i]] ]],
        "lat" -> parsed[[ tourPath[[i]] ]]["lat"],
        "lon" -> parsed[[ tourPath[[i]] ]]["lon"],
        "stop" -> i
      |>,
      {i, Length[tourPath]}
    ];

    <|
      "orderedRoute"    -> orderedCoords,
      "orderedIds"      -> orderedIds,
      "totalDistanceKm" -> Round[totalDistance, 0.1],
      "numberOfStops"   -> Length[tourPath],
      "algorithm"       -> "FindShortestTour (Wolfram TSP Solver)",
      "poweredBy"       -> "Wolfram — FindShortestTour + GeoDistance"
    |>
  ] &,
  "JSON"
];

CloudDeploy[optimizeRouteAPI, "CleanSweepRoute", Permissions -> "Public"]
