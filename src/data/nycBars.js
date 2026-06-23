// Curated, web-verified NYC-area spots to watch World Cup 2026 matches, researched
// across roundups (Eater/Time Out/Infatuation/NYC Tourism/worldcup.nyc), venue
// sites + Instagram/Twitter, and supporters'-club pages. Two parts:
//   generalSoccerPubs — reliable bars that show every match (any-game fallback)
//   byCountry         — best spot(s) per nation, keyed by ESPN displayName
//                       (e.g. "United States", "South Korea", "Congo DR")
//
// Judgment calls: we lead with the genuinely BEST / most authentic spot per team,
// Manhattan-preferred but expanding to Brooklyn/Queens/Bronx/NJ when that's where
// the real scene is (each entry's `area` marks the borough). Every venue was
// verified as real + currently open (June 2026); closed/uncertain ones (Nevada
// Smith's, old Zum Schneider East Village, Iraqi House, St. Andrews, etc.) were
// excluded. `source` is the evidence link. Map links are built from name + area.

export const NYC_BARS = {
  generalSoccerPubs: [
    { name: 'Football Factory at Legends', area: 'Koreatown, Manhattan', vibe: 'Stadium-scale soccer HQ, 20+ screens', why: "NYC's flagship football venue and official home to 30+ supporters groups — the closest thing to a matchday ground. First-come, first-served.", source: 'https://www.legendsffnyc.com/supporters-groups-1' },
    { name: 'Smithfield Hall', area: 'Flatiron, Manhattan', vibe: 'Purpose-built football bar, 26 screens, sound on', why: "Widely called NYC's only purpose-built soccer bar; shows every match with full audio and homes 9+ supporters clubs (incl. American Outlaws Manhattan).", source: 'https://smithfieldnyc.com/fan-clubs/' },
    { name: 'The Red Lion', area: 'Greenwich Village, Manhattan', vibe: '40-year Bleecker St football pub', why: "Downtown's longtime 'any game' home — every televised fixture on 10+ HD screens, doors at 11am on match days, walk-ins only.", source: 'https://www.redlionnyc.com/nycs-home-for-the-fifa-world-cup/' },
    { name: "Carragher's", area: 'Financial District, Manhattan', vibe: "Jamie Carragher's two-floor pub", why: 'A dependable Lower Manhattan football bar (co-owned by the Liverpool legend) showing the full World Cup slate with proper game-day pub grub.', source: 'https://www.carraghersnyc.com/' },
    { name: "McHale's Bar & Grill", area: 'Theater District, Manhattan', vibe: 'Classic Irish bar, 100-inch projector', why: 'Midtown home of Soccer Republic & the NY Celtic club; every major league + a reliable spot for any World Cup fixture, open 11am–4am.', source: 'https://www.celticbars.com/celtic-bar/mchales-bar-and-grill/' },
    { name: '11th Street Bar', area: 'East Village, Manhattan', vibe: 'Casual Irish bar, electric on matchdays', why: 'Home of OLSC New York, the oldest Liverpool supporters club in the US; opens an hour before kickoff, atmospheric for big matches.', source: 'https://www.lfcny.org/' },
    { name: 'Banter', area: 'Williamsburg, Brooklyn', vibe: 'Definitive Brooklyn soccer bar', why: 'Official NYCFC pub partner; opens early (7–7:30am weekends) for all soccer and treats the World Cup as the event of the century. Top non-Manhattan pick.', source: 'https://www.newyorkcityfc.com/news/pub-partner-spotlight-banter-bar' },
    { name: 'Bohemian Hall & Beer Garden', area: 'Astoria, Queens', vibe: 'Historic 1910 outdoor beer garden', why: 'Big-screen World Cup viewing outdoors with Astoria’s famously diverse crowd — a communal, deeply-rooted multinational atmosphere.', source: 'https://www.bohemianhall.com/' },
  ],
  byCountry: {
    Portugal: [
      { name: 'Time Out Market — "Portugal House"', area: 'Union Square, Manhattan', vibe: 'Food-hall watch party, big screens, DJ', why: 'Official Portugal House — Time Out Market partnered with the Portuguese Football Federation to stream every Portugal match with Visit Portugal activations.', source: 'https://www.timeout.com/about/latest-news/time-out-market-new-york-brooklyn-and-the-portuguese-football-federation-launch-portugal-house-for-fifa-world-cup-2026-061226' },
      { name: 'Sport Club Português / Ironbound', area: 'Newark, NJ (Ironbound)', vibe: 'Portuguese-American heartland', why: 'The genuine Portuguese epicenter (club est. 1921) with an official open-air Fan Village — beats Manhattan for pure atmosphere if you’ll travel.', source: 'https://casadepaconj.com/world-cup/' },
    ],
    Spain: [
      { name: 'La Nacional', area: "Chelsea / 'Little Spain', Manhattan", vibe: '150-year Spanish society cantina', why: "Founded 1868 — the literal historic home of NYC's Spanish community, the most authentic La Roja room in Manhattan.", source: 'https://www.theinfatuation.com/new-york/guides/where-to-watch-the-world-cup-nyc' },
      { name: 'Socarrat Paella Bar', area: 'Chelsea / Nolita, Manhattan', vibe: 'Spanish tapas + paella bar', why: 'Part of the FIFA NY/NJ host program; broadcasts all Spain games with tapas + drink specials. Nolita has the big screen.', source: 'https://socarratnyc.com/watch-spain-world-cup-nyc/' },
    ],
    France: [
      { name: 'Cafe Du Soleil', area: 'Upper West Side, Manhattan', vibe: 'Classic French bistro, moules-frites', why: "Best reliably-French match-day room in Manhattan — 'you can hear Allez Les Bleus from a block away.'", source: 'https://www.theinfatuation.com/new-york/reviews/cafe-du-soleil' },
      { name: 'Bar Tabac', area: 'Carroll Gardens, Brooklyn', vibe: 'French bistro, parties spill into the street', why: 'Smith St is French Brooklyn and Bar Tabac is its anchor — the most packed, authentic Les Bleus crowd in the city.', source: 'https://www.worldcup.nyc/guides/where-france-fans-watch-the-world-cup-in-nyc' },
    ],
    England: [
      { name: 'The Football Factory at Legends', area: 'Koreatown, Manhattan', vibe: 'Three-level soccer bar, loud, sound-on', why: "Verified home of the official 'England National Team NYC' supporters group — the loudest Three Lions viewing in Manhattan.", source: 'https://www.legendsffnyc.com/supporters-groups-1' },
      { name: 'Jones Wood Foundry', area: 'Upper East Side, Manhattan', vibe: 'Traditional British gastropub', why: "Flagged by NYC Tourism as 'a prime spot to catch the Three Lions' — for fans who want a proper British-pub feel over a megabar.", source: 'https://www.nyctourism.com/articles/soccer-bars-in-nyc/' },
    ],
    Germany: [
      { name: 'Reichenbach Hall', area: 'Midtown, Manhattan', vibe: "NYC's largest German beer hall", why: 'Bavarian energy, communal tables and steins; runs WC 2026 watch parties with reserved seating for main matches.', source: 'https://www.nyctourism.com/articles/soccer-bars-in-nyc/' },
      { name: 'The Heidelberg', area: 'Yorkville, Manhattan', vibe: 'German restaurant since 1939', why: "The last authentic German spot in historic Yorkville; TVs on for Germany matches with a longtime German-American crowd.", source: 'https://www.worldcup.nyc/guides/where-germany-fans-watch-the-world-cup-in-nyc' },
    ],
    Netherlands: [
      { name: "Hurley's Saloon", area: "Hell's Kitchen, Manhattan", vibe: '130-year, three-story pub — turns orange', why: 'Official home of the Netherlands Club of New York; 100+ fans in orange pack it for Oranje matches, with confirmed 2026 watch parties.', source: 'https://www.nlclub.nyc/' },
    ],
    Belgium: [
      { name: "Cafe d'Anvers", area: 'East Harlem, Manhattan', vibe: 'Belgian bistro, sidewalk frietkot', why: 'The most genuinely Belgian-owned spot in NYC, hosting weekend block parties with big screens during the tournament.', source: 'https://www.theinfatuation.com/new-york/reviews/cafe-danvers' },
    ],
    Croatia: [
      { name: 'Rudar Club', area: 'Astoria, Queens', vibe: "Croatian/Istrian social club (since '70s)", why: 'An actual Croatian supporters club, not a themed bar — a genuine community scene on national-team match days. Arrive early.', source: 'https://www.theinfatuation.com/new-york/reviews/rudar-club' },
    ],
    Switzerland: [
      { name: 'The Lavaux (Swiss Wine & Fondue Bar)', area: 'West Village, Manhattan', vibe: 'Genuinely Swiss — fondue, Swiss wine, projectors', why: 'Official Swiss Society of New York partner venue showing all three Switzerland group-stage matches.', source: 'https://www.swisssociety.org/upcoming-events/world-cup-2026' },
    ],
    Scotland: [
      { name: 'The Football Factory at Legends', area: 'Koreatown, Manhattan', vibe: 'Dedicated multi-level soccer bar', why: "Verified home of 'Tartan Army NYC.' They designate the match bar per fixture, but Legends is the standing Scottish supporters home.", source: 'https://www.legendsffnyc.com/supporters-groups-1' },
    ],
    Norway: [
      { name: 'Kabin', area: 'SoHo, Manhattan', vibe: 'Nordic-chic cafe/cocktail bar, flags everywhere', why: "CBS New York's confirmed home base for every Norway kick-off — 'we wave that flag extra high.' First Norway World Cup since 1998.", source: 'https://www.cbsnews.com/newyork/news/world-cup-nordic-bar-nyc-kabin-soho/' },
    ],
    Sweden: [
      { name: 'Kabin', area: 'SoHo, Manhattan', vibe: 'Nordic bar (shared Scandi home base)', why: 'CBS New York confirms Kabin hosts Sweden watch parties as home base for Scandi teams without their own country bar.', source: 'https://www.cbsnews.com/newyork/news/world-cup-nordic-bar-nyc-kabin-soho/' },
    ],
    Czechia: [
      { name: 'Bohemian Spirit Restaurant', area: 'Upper East Side, Manhattan', vibe: 'Authentic Czech restaurant/bar', why: 'A genuine Czech venue in the historic Bohemian National Hall, advertising World Cup watch parties — the Manhattan Czech pick.', source: 'https://bohemianspiritrestaurant.com/' },
      { name: 'Bohemian Hall & Beer Garden', area: 'Astoria, Queens', vibe: 'Iconic ~1910 Czech beer garden', why: 'Built by Czech immigrants — the natural rallying point for Czechia, matches across the beer-garden TVs.', source: 'https://www.bohemianhall.com/' },
    ],
    'United States': [
      { name: 'Long Acre Tavern', area: 'Times Square, Manhattan', vibe: 'Three-floor sports bar, official Outlaws HQ', why: 'The official home bar of the American Outlaws NYC chapter for USMNT matches — organized watch parties, chants, sound on.', source: 'https://theamericanoutlaws.com/chapters/nyc' },
      { name: 'Smithfield Hall', area: 'Flatiron, Manhattan', vibe: 'Purpose-built soccer bar, dozens of TVs', why: 'Home of the American Outlaws Manhattan chapter — a congregation point for the city’s most dedicated Team USA supporters.', source: 'https://smithfieldnyc.com/fan-clubs/american-outlaws-nyc/' },
    ],
    Mexico: [
      { name: 'Animo!', area: 'Midtown East, Manhattan', vibe: 'Authentic Mexican restaurant, giant-screen El Tri parties', why: 'Hosts El Tri viewing parties on a giant screen with full sound — the strongest Manhattan Mexico option.', source: 'https://www.nyctourism.com/restaurants/animo/' },
      { name: 'Roosevelt Ave taquerias', area: 'Corona, Queens', vibe: 'Heart of Mexican New York', why: 'The Roosevelt Ave corridor packs Mexican bars that erupt for every Mexico match — the deepest community scene.', source: 'https://www.theinfatuation.com/new-york/guides/where-to-watch-the-world-cup-nyc' },
    ],
    Argentina: [
      { name: 'Football Factory at Legends', area: 'Koreatown, Manhattan', vibe: 'Supporters-club soccer temple, drums + chants', why: 'Home of River Plate New York — the most committed Albiceleste supporter-club bar in Manhattan, flag-draped on matchdays.', source: 'https://www.legendsffnyc.com/' },
      { name: 'Boca Juniors Restaurant', area: 'Elmhurst, Queens', vibe: 'Argentine parrilla, blue-and-white crowd', why: 'Named for the club and packed with Argentine fans from Little Argentina over skirt steak and empanadas.', source: 'https://www.theinfatuation.com/new-york/guides/where-to-watch-the-world-cup-nyc' },
    ],
    Brazil: [
      { name: 'Via Brasil', area: "Little Brazil / Midtown, Manhattan", vibe: 'Old-school churrascaria on Rua 46', why: 'Anchor of West 46th St’s Little Brazil — the Manhattan epicenter of green-and-gold, where the block fills with Seleção fans.', source: 'https://viabrasilrestaurantnyc.com/' },
      { name: 'Beco', area: 'Williamsburg, Brooklyn', vibe: 'São Paulo-style boteco, sidewalk fan zone', why: 'Throws a neighborhood street watch party every World Cup — giant screen, Brazilian music, caipirinhas. Reservations fill fast.', source: 'https://www.becobar.com/' },
    ],
    Colombia: [
      { name: "SOB's (Sounds of Brazil)", area: 'Hudson Square, Manhattan', vibe: 'Big-screen official watch party, loud', why: "Hosting Colombia-branded WC 2026 watch parties on a 16'×18' LED wall — the rare real Manhattan option for Colombia fans. Free w/ RSVP.", source: 'https://sobs.com/worldcup/' },
      { name: 'Mis Tierras Colombianas', area: 'Woodside, Queens', vibe: 'Family-owned Colombian restaurant', why: 'Whichever way you turn there’s a game on a projector and a Colombian flag — a true community spot in Queens.', source: 'https://www.theinfatuation.com/new-york/guides/where-to-watch-the-world-cup-nyc' },
    ],
    Uruguay: [
      { name: "El Chivito D'Oro", area: 'Jackson Heights, Queens', vibe: 'Family-run Uruguayan steakhouse, trophies on the shelf', why: "One of NYC's flagship Uruguayan restaurants (30+ yrs) — a nostalgic gathering spot for the community to watch La Celeste.", source: 'https://www.theinfatuation.com/new-york/reviews/el-chivito-d-oro' },
    ],
    Ecuador: [
      { name: 'Barzola', area: 'Jackson Heights, Queens', vibe: 'Classic Ecuadorian restaurant + full bar', why: 'A Jackson Heights institution named by NYC Tourism as a gathering spot for La Tri fans, in the heart of the Ecuadorian community.', source: 'https://www.nyctourism.com/articles/soccer-bars-in-nyc/' },
    ],
    Paraguay: [
      { name: 'I Love Paraguay', area: 'Sunnyside, Queens', vibe: 'Small family Paraguayan restaurant', why: 'The one genuine Paraguay fan spot in NYC — family-run, with its own Paraguayan beer, where Albirroja fans gather.', source: 'https://www.ilovepy.com/' },
    ],
    Panama: [
      { name: "Michelle's Cocktail Lounge", area: 'Flatbush, Brooklyn', vibe: 'Retro 1972 lounge, Panamanian flavors', why: 'The one real Panama fan spot in NYC, an institution among Panamanian-Americans since 1972. Small (~75) — check socials first.', source: 'https://www.theinfatuation.com/new-york/reviews/michelles-cocktail-lounge' },
    ],
    Morocco: [
      { name: 'Café Mogador', area: 'East Village, Manhattan', vibe: 'Veteran family-run Moroccan restaurant', why: "One of NYC's oldest Moroccan restaurants (since 1983) — the Manhattan cultural anchor for Atlas Lions supporters.", source: 'https://watchworldcup.nyc/venues/cafe-mogador' },
      { name: 'Dream Cafe & Hookah', area: "Astoria / 'Little Morocco', Queens", vibe: '24/7 hookah lounge, anthem-singalong energy', why: "On the Steinway St Moroccan strip — 'filled to the brim with Morocco fans' singing the anthem at kickoff during their run.", source: 'https://patch.com/new-york/astoria-long-island-city/astorias-little-morocco-watches-end-improbable-world-cup-run' },
    ],
    Senegal: [
      { name: 'Le Baobab', area: 'Little Senegal / Harlem, Manhattan', vibe: 'Homey Senegalese dining room', why: "Anchor of Harlem's Little Senegal on 116th St — extra screens go up and the block fills with flags on match days.", source: 'https://www.worldcup.nyc/guides/where-senegal-fans-watch-the-world-cup-in-nyc' },
    ],
    Ghana: [
      { name: 'Papaye Restaurant', area: 'Fordham, The Bronx', vibe: 'Unassuming Ghanaian storefront', why: "The documented gathering place for the Bronx's large Ghanaian community to watch the Black Stars.", source: 'https://www.nyctourism.com/restaurants/papaye/' },
      { name: 'Accra Express', area: 'Harlem, Manhattan', vibe: 'Ghanaian spot (black-star logo)', why: 'The Harlem offshoot of Bronx’s Accra Restaurant — a Manhattan option for Black Stars fans, jollof and waakye included.', source: 'https://www.instagram.com/accrarestaurant/' },
    ],
    Algeria: [
      { name: 'Merguez & Frites', area: 'Astoria, Queens', vibe: 'Tiny family-run Algerian counter spot', why: "One of the only Algerian-owned eateries in NYC and the named gathering spot for devoted Algerian fans — kofta, merguez and matches.", source: 'https://www.theinfatuation.com/new-york/reviews/merguez-and-frites' },
    ],
    Egypt: [
      { name: 'Hayati Lounge', area: "Astoria / 'Little Egypt', Queens", vibe: 'Modern hookah lounge, big screens', why: "A hub for Astoria soccer fans showing all matches; packed wall-to-wall for Egypt with fans spilling outside. Open 4pm–4am.", source: 'https://www.nysoccerjournal.com/with-egypt-fans-for-2026-world-cup-on-steinway-street-in-astoria-queens/' },
      { name: "Sabry's", area: 'Astoria, Queens', vibe: 'Beloved Alexandrian seafood institution', why: "The best-known Egyptian restaurant on Steinway — a core 'Little Egypt' gathering spot during the World Cup.", source: 'https://www.nyctourism.com/articles/experience-the-world-cup-with-locals-from-these-communities-in-nyc/' },
    ],
    Tunisia: [
      { name: 'Merguez & Frites', area: 'Astoria, Queens', vibe: 'Maghrebi counter spot, North African crowd', why: 'No dedicated Tunisian venue exists in NYC; this Steinway-area Maghrebi spot serves Tunisian-style couscous and draws the crowd Carthage Eagles fans cluster into.', source: 'https://www.nyctourism.com/articles/experience-the-world-cup-with-locals-from-these-communities-in-nyc/' },
    ],
    'Ivory Coast': [
      { name: 'New Ivoire', area: 'East Harlem, Manhattan', vibe: '24-hour Ivorian comfort-food spot', why: "A Manhattan Ivorian restaurant serving 'like home' sauces, open 24 hours — an easy any-kickoff gathering option for Ivory Coast fans.", source: 'https://www.yelp.com/biz/new-ivoire-new-york' },
      { name: 'YopCity Restaurant', area: 'Belmont, The Bronx', vibe: 'Lively Ivorian spot, music + attiéké', why: "The best-known dedicated Ivorian restaurant in NYC (named for Abidjan's Yopougon) — the natural Bronx rallying point.", source: 'https://www.instagram.com/yopcity_restaurantnyc/' },
    ],
    'Cape Verde': [
      { name: 'Honey Fitz', area: 'Astoria, Queens', vibe: 'Official Cape Verde supporters pub', why: "The owner made Honey Fitz the NYC Cape Verde supporters bar to honor captain 'Pico' Lopes — it went viral after Lopes reshared it, with Cape Verdean food and grogue.", source: 'https://qns.com/2026/06/astoria-honey-fitz-cape-verde-world-cup/' },
    ],
    'South Africa': [
      { name: 'Kaia Wine Bar', area: 'Upper East Side, Manhattan', vibe: 'Cozy South African farmhouse wine bar', why: "Bills itself as 'NYC's only South African restaurant' — the anchor of the SA expat community, drawing fans for braai food and Bafana Bafana games.", source: 'https://www.yelp.com/biz/kaia-new-york' },
      { name: 'Berber Street Food @ The Hungry Pearl', area: 'Financial District, Manhattan', vibe: 'African food-hall stall, country-by-country parties', why: 'Explicitly hosting per-country African watch parties (South Africa named) — the de facto pan-African Manhattan spot.', source: 'https://downtownny.com/news/where-to-watch-world-cup-bars-downtown-nyc/' },
    ],
    'Congo DR': [
      { name: 'Berber Street Food @ The Hungry Pearl', area: 'Financial District, Manhattan', vibe: 'African food-hall stall, country-by-country parties', why: 'DR Congo is explicitly on its roster of African viewing parties with Congolese dishes — the realistic Manhattan place Leopards fans can gather (no Congolese restaurant in NYC).', source: 'https://downtownny.com/news/where-to-watch-world-cup-bars-downtown-nyc/' },
    ],
    Iran: [
      { name: 'Persepolis', area: 'Upper East Side, Manhattan', vibe: 'Veteran Persian kebab house, full bar', why: "Manhattan's most established Persian restaurant (20+ yrs), founded by a former Persepolis FC goalkeeper — the default UES gathering point for Team Melli nights.", source: 'https://www.persepolisny.com/' },
      { name: "Bijan's", area: 'Boerum Hill, Brooklyn', vibe: 'Cozy modern Persian-American bistro, full bar', why: "Brooklyn's go-to Persian/Iranian spot (full bar, open late) — draws the Brooklyn Persian community for Team Melli.", source: 'https://bijansbrooklyn.com/' },
    ],
    Iraq: [
      { name: 'Bay Ridge Cafe', area: "Bay Ridge / 'Little Arabia', Brooklyn", vibe: 'Late-night Arab hookah cafe, big TVs', why: "NYC has no dedicated Iraqi venue; Bay Ridge's 'Little Arabia' hookah cafes are where broader Arab/Iraqi fans cluster. Open to 5am.", source: 'https://www.yelp.com/biz/bay-ridge-cafe-brooklyn-2' },
    ],
    Jordan: [
      { name: 'Ayat', area: "Bay Ridge / 'Little Arabia', Brooklyn", vibe: 'Lively Levantine restaurant, family-style', why: "Bay Ridge is NYC's Levantine hub and Ayat is its anchor — it serves Mansaf (Jordan's national dish), the most authentic rallying point for Jordan's first World Cup.", source: 'https://www.ayatnyc.com/location/bayridge/' },
    ],
    'Saudi Arabia': [
      { name: 'Hayati Lounge', area: "Astoria / 'Little Egypt', Queens", vibe: 'Gulf-friendly hookah lounge, all matches on', why: "On Astoria's Steinway Arab strip; shows all matches and explicitly expects Gulf visitors from Saudi Arabia and Qatar — the most plausible spot for Saudi fans.", source: 'https://www.nysoccerjournal.com/with-egypt-fans-for-2026-world-cup-on-steinway-street-in-astoria-queens/' },
    ],
    Japan: [
      { name: 'Lucky Cat', area: 'Midtown East, Manhattan', vibe: 'Lively Japanese izakaya, late-night', why: "The clearest Samurai Blue spot in Manhattan: live-streaming Japan's matches, Kirin-sponsored, with a 'Blue Samurai' shot each time Japan scores.", source: 'https://izakayaluckycat.com/' },
      { name: 'Gosuke', area: 'Garment District, Manhattan', vibe: 'Authentic sushi izakaya', why: "Hosting official 'Game Watch Parties' for Japan backed by the Japanese-American community network — a real Samurai Blue gathering zone.", source: 'https://gosukerestaurant.com/' },
    ],
    'South Korea': [
      { name: 'Pocha 32', area: 'Koreatown, Manhattan', vibe: 'Rowdy K-pop pocha, soju buckets', why: "The OG pocha of K-Town — the loud, soju-soaked street-pub format where the 32nd St watch crowd gathers in red on Korea match days.", source: 'https://www.pocha32.com/' },
      { name: 'BCD Tofu House', area: 'Koreatown, Manhattan', vibe: 'Late-night Korean BBQ/tofu house', why: 'Anchor of K-Town on 32nd St; puts Korea’s matches on its screens and stays open late (to 5am weekends) for the overnight kickoffs.', source: 'https://www.worldcup.nyc/guides/where-south-korea-fans-watch-the-world-cup-in-nyc/' },
    ],
    Australia: [
      { name: 'Old Mates Pub', area: 'Financial District, Manhattan', vibe: 'Boisterous multi-floor Aussie pub', why: 'The only real Australian pub in NYC (Hugh Jackman-backed); explicitly hosts Socceroos viewing nights — the de facto HQ for Aussie expats.', source: 'https://www.oldmates.com/' },
    ],
    'New Zealand': [
      { name: 'The Winslow', area: 'East Village, Manhattan', vibe: "NYC's dedicated rugby pub", why: "No Kiwi bar exists in NYC, so Kiwi expats cluster at the city's main rugby pub — it opens early for international kickoffs and welcomes the All Whites crowd.", source: 'https://thewinslownyc.com/rugby-bar-nyc/' },
    ],
    Uzbekistan: [
      { name: "Chaikhana Sem Sorok ('Little Bukhara')", area: 'Rego Park, Queens', vibe: 'Authentic Bukharian/Uzbek tea house', why: "Heart of NYC's Bukharian community (tens of thousands emigrated from Uzbekistan) — huge pride in their first-ever World Cup. Daytime hours fit early kickoffs; call ahead.", source: 'https://www.chaikhanasemsorok.com/little-bukhara' },
      { name: 'Nargis Cafe', area: 'Sheepshead Bay, Brooklyn', vibe: 'Bustling Uzbek/Central Asian restaurant', why: "In the Brooklyn Uzbek heartland — the best-known Uzbek restaurant (plov, samsa, shashlik). Confirm TV by phone before a match.", source: 'https://nargiscafe.com/' },
    ],
  },
}
