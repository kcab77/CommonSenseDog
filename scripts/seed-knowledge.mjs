import { Pinecone } from '@pinecone-database/pinecone'

const GEMINI_KEY = 'AIzaSyDFlZel5eptREmoCCwGI3PD8YIfNEWxpwM'
const PINECONE_KEY = 'pcsk_32Qfff_L1BffexM3M1nFkLtskMXcJ5a6TKKabMn3n7Bn9YsHoFbpCuqwLdFHe8uKnKDQ7s'
const INDEX_NAME = 'dog-knowledge-database'

const pc = new Pinecone({ apiKey: PINECONE_KEY })
const index = pc.index(INDEX_NAME)

async function embed(text) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'models/gemini-embedding-001', content: { parts: [{ text }] }, outputDimensionality: 768 }),
    }
  )
  const data = await res.json()
  if (!data.embedding?.values) {
    console.error('Embed failed:', JSON.stringify(data))
    throw new Error('Embedding failed')
  }
  return data.embedding.values
}

async function upsert(id, text, category) {
  const values = await embed(text)
  await index.upsert({ records: [{ id, values, metadata: { text, category } }] })
  console.log(`✓ ${id}`)
}

const knowledge = [
  // FLEA & TICK
  {
    id: 'flea-tick-stack',
    category: 'flea-tick',
    text: `Natural flea and tick prevention stack recommended by Dr. Judy Morgan:
1. The Resistance by Wildly Blended — 1 tsp daily in food, takes 4-6 weeks to build up, works inside-out altering body scent so bugs don't land. Only layer swimming cannot wash off. All organic, safe long term.
2. animalEO EVICT Ready to Use — 4-10 drops massaged into coat (legs, neck, shoulders, ankles) before every outing.
3. Edens Garden Rose Geranium Essential Oil (Pelargonium roseum, 100% pure) — 1 drop behind each shoulder blade, 1 drop near base of tail. Safe undiluted on dogs. Dr. Morgan's #1 tick recommendation.
4. Bandana method after swims — 2-3 drops rose geranium + 2-3 drops EVICT tied around neck. Keeps releasing repellent all day without reapplying to coat.
5. Metal fine-tooth flea comb after every outing — ears, neck, armpits, groin, between toes. Run over white paper towel — flea dirt turns red/brown when wet. Essential for black-coated dogs.
6. Project Sudz Hypoallergenic Oatmeal & Manuka Honey Shampoo — monthly bath, cleaning only, not flea protection.
Why skipped: FleasGone tag (no studies, electromagnetic concerns), Woof Creek (redundant with The Resistance), coconut oil supplement (pancreatitis risk on high fat diet).`
  },
  {
    id: 'heartworm-protocol',
    category: 'flea-tick',
    text: `Heartworm prevention: Heartgard PLUS (not plain Heartgard) monthly. Active outdoor dogs on beaches, softball fields, trails have high hookworm and roundworm exposure. Paws absorb hookworm larvae from wet contaminated ground. Plain Heartgard only covers heartworm — Plus adds pyrantel which kills hookworms and roundworms. Do NOT switch to plain Heartgard for active outdoor dogs. The Resistance and EVICT also reduce mosquito exposure as a bonus.`
  },

  // DIET & NUTRITION
  {
    id: 'tcvm-protein-temperatures',
    category: 'nutrition',
    text: `TCVM (Traditional Chinese Veterinary Medicine) protein temperature guide for dogs:
COOLING proteins (best for dogs that run hot, have inflammation, lipomas, allergies): Duck, fish/salmon, rabbit, venison
NEUTRAL proteins (fine for all dogs): Beef, turkey, pork
WARMING proteins (limit as staple for hot dogs): Chicken, lamb
For dogs that run hot: aim for cooling proteins 4-5x a week, neutral 2-3x, warming occasionally. Only be strict if dog shows active heat signs: excessive panting, red eyes, always thirsty, seeking cold surfaces. Can rotate freely — TCVM goal is overall diet trend, not every meal.`
  },
  {
    id: 'lipoma-diet-rules',
    category: 'lipomas',
    text: `Lipoma management through diet:
AVOID: Sunflower, safflower, corn, soybean, vegetable oil (high omega-6, inflammatory). Corn, wheat, soy (inflammatory grains). Peas, lentils, chickpeas, canola (legumes). BHA, BHT, ethoxyquin, artificial colors, sugar/corn syrup. Foods with >20% carbohydrate (feeds lipoma growth via insulin → fat storage).
SUPPORT: Simple Food Project freeze-dried (0.85:1 omega-3:6 ratio, best anti-inflammatory baseline). Fish/salmon proteins (cooling + best omega-3s). Duck (cooling, anti-inflammatory). Four Leaf Rover Liver & Kidney Clean (lipoma management + liver detox support).
Science: Lipoma tissue has elevated proliferating fat stem cells driven by inflammatory signals. Insulin resistance from high-starch diets promotes peripheral fat storage. Poor omega-6:omega-3 ratio (10:1 to 25:1 in most kibble vs optimal 5:1 or lower) creates pro-inflammatory environment. Impaired liver function impairs fat metabolism.`
  },
  {
    id: 'whole-food-diet-rotation',
    category: 'nutrition',
    text: `Recommended whole food diet rotation for dogs:
- AllProvide (allprovide.com) — gently cooked, AAFCO complete, minimal ingredients, no grains/legumes, nutrients from whole food sources. Dr. Judy Morgan has a specific diet formulated on AllProvide.
- Simple Food Project (simplefoodproject.com) — freeze-dried, all natural, no added synthetic vitamins, excellent 0.85:1 omega-3:6 ratio, therapeutic for lipomas and inflammation. 25-30% of daily diet as omega anchor.
- Primal patties (freeze-dried) — variety and backup when AllProvide sold out.
- Uziwi Pets (uziwipets.com) — air-dried, 5 or fewer added vitamins/minerals.
Avoid: Most gently cooked brands (Open Farm, etc.) have peas, lentils, brown rice + long synthetic vitamin lists. When AllProvide is sold out, lean heavier on Simple Food Project + Primal rather than substituting another gently cooked brand with the same issues.
Protein introduction protocol: Start new protein at 25% for ~1 week, if stools normal bump to 50%, then 75%. Introduce one new brand AND one new protein at a time — not both same week.`
  },
  {
    id: 'daily-nutrition-additions',
    category: 'nutrition',
    text: `Beneficial daily additions to dog food:
- 1 whole raw egg daily — safe, yolk biotin offsets egg white avidin, excellent source of protein, fat-soluble vitamins, choline. One of the most nutritionally complete whole foods for dogs.
- Raw goat milk — probiotics, digestive enzymes, easily digestible protein, supports gut health. Good for transition periods.
- Bone broth (unsalted, no onion/garlic) — joint support, gut healing, adds moisture to food.
- Sardines in water (no salt) — excellent whole food omega-3 source, cooling protein, great for lipomas and inflammation. Add 1-2 times per week.`
  },
  {
    id: 'kibble-problems',
    category: 'nutrition',
    text: `Why kibble is problematic for dogs:
Extruded kibble is processed at 250-300°F under high pressure — destroys virtually all natural enzymes and beneficial bacteria. Synthetic vitamins added back post-processing are in inferior forms (menadione, sodium selenite, copper sulfate, cholecalciferol, zinc oxide).
Most kibble has omega-6 to omega-3 ratio of 10:1 to 25:1 (optimal is 5:1 or lower) — creates pro-inflammatory baseline.
High starch content (often 40-60% of kibble is carbohydrates) drives insulin resistance and fat storage.
Labs have a documented POMC gene mutation making them more carb/glucose driven — slightly higher carb need than most breeds (10-20% optimal), but high carbs (>30%) feeds lipoma growth.
Transitioning off kibble: energy increase usually noticed within 2-4 weeks. Expect 4-8 weeks of shedding (detox shed) when switching to whole food.`
  },

  // ORGANS & VITAMINS
  {
    id: 'organ-feeding-rules',
    category: 'nutrition',
    text: `Dog organ feeding rules:
TRUE ORGANS (follow 10% rule due to Vitamin A accumulation): Liver — extremely nutrient dense, HIGH in Vitamin A (fat-soluble, accumulates in liver). Cap at 10% of diet. Best source of Vitamin A, B12, folate, iron, copper. Kidney — similar caution in very high amounts, rich in B12, selenium, iron, zinc. Spleen — fine in moderate amounts but very rich, can cause loose stools.
MUSCLE MEATS (classified as organs but NO accumulation risk — feed freely): Heart — muscle meat not a true organ. Rich in TAURINE (critical for heart health), CoQ10, B vitamins, iron, zinc. Can be fed as primary protein, no upper limit. Gizzard — fine in higher quantities. Lung — lightweight protein, iron. Tripe — probiotics, digestive enzymes, balanced omega ratio.
KEY RULE: Only liver has the strict 10% cap. Heart, gizzard, lung, tripe = free to feed as primary protein.`
  },
  {
    id: 'vitamins-minerals-good-vs-bad',
    category: 'nutrition',
    text: `Dog food vitamins and minerals — good forms vs bad forms:
AVOID (toxic/accumulate/poor bioavailability):
- Menadione (synthetic K3): depletes glutathione, damages liver cells and red blood cells, hemolytic anemia risk
- Sodium Selenite: generates free radicals, progressive kidney tubule damage. Use selenomethionine instead.
- Copper Sulfate: accumulates in liver silently over years, chronic hepatitis. Labs and Dobermans especially vulnerable. Use copper proteinate instead.
- Cholecalciferol (synthetic D3): narrowest safe range of any dog nutrient, multiple FDA recalls from overdose causing kidney failure/death. Get D from whole food fish, egg yolk.
- Zinc Oxide: poorly absorbed, hemolytic anemia risk especially in Huskies/Malamutes. Use zinc proteinate.
- Ferric Oxide: unabsorbable, used as colorant only, zero nutrition.
USE WITH CAUTION: Retinyl palmitate/acetate (synthetic fat-soluble Vitamin A, builds up). Pyridoxine HCl (safe at normal levels). Cyanocobalamin (inferior B12, contains trace cyanide — use methylcobalamin). Zinc Sulfate (poor bioavailability). dl-Alpha Tocopherol (synthetic Vitamin E, lower bioavailability than natural d-Alpha).
PATTERN: Inorganic forms (sulfates, oxides, selenite) = bad. Organic/chelated (proteinate, chelate, methionine) = good.`
  },
  {
    id: 'preservatives-research',
    category: 'nutrition',
    text: `Dangerous preservatives in dog food — research backed:
- BHA: NTP long-term studies show squamous cell tumors in rats/mice/hamsters. IARC Group 2B possible carcinogen. California Prop 65 listed.
- BHT: Causes liver cell hypertrophy, inhibits thyroid peroxidase (disrupts hormone production). Tumor promoter in Food & Chemical Toxicology study.
- Ethoxyquin: Originally a pesticide. FDA requested voluntary reduction 1997. Causes liver enzyme elevation, kidney lesions, immune dysfunction in dogs. Banned in human food in many countries.
- TBHQ: Immune system concerns and tumor development in animal studies at high doses. Banned in several countries.
- Sodium Nitrite: Forms nitrosamines during digestion, associated with cancer risk in animal studies.
Safe preservatives: Mixed tocopherols (natural Vitamin E), rosemary extract, ascorbic acid (Vitamin C).`
  },
  {
    id: 'processing-methods',
    category: 'nutrition',
    text: `Dog food processing methods and enzyme/nutrient survival:
- Raw/Freeze-dried: No heat or very low temp. ~95% enzyme survival. Best bioavailability, most nutrients intact.
- Dehydrated (Honest Kitchen): 104-118°F. Most enzymes survive. Right at enzyme threshold. Human-grade.
- Gently Cooked (AllProvide, Simple Food Project): Low-medium heat. Partial enzyme survival. Far better than kibble. Some enzymes lost.
- Wet/Canned: 240-250°F. Mostly destroyed. Hotter than kibble in some cases, but whole ingredients still present.
- Baked Kibble: High heat. Mostly destroyed. Better than extruded, still significant loss.
- Extruded Kibble: 250-300°F under pressure. Virtually zero enzymes. Synthetic vitamins added back post-processing.
Key: 118°F destroys virtually all natural enzymes. Dogs eating raw diets generally don't need enzyme supplements. Adding digestive enzymes to kibble or gently cooked food is highly recommended.`
  },

  // SUPPLEMENTS
  {
    id: 'medicinal-mushrooms',
    category: 'supplements',
    text: `Medicinal mushrooms for dogs — evidence-based guide:
Active compounds: Beta-glucans (complex polysaccharides in cell walls) are biological response modifiers — they modulate the immune system's ability to recognize and respond to pathogens and tumors. CRITICAL: Active compounds are in the fruiting body, NOT the mycelium. Cheap supplements use mycelium on grain = mostly starch, very low beta-glucan. Always look for "fruiting body" with beta-glucan percentage listed.

Turkey Tail (Trametes versicolor): Strongest clinical evidence. University of Pennsylvania randomized controlled trial: dogs with hemangiosarcoma receiving turkey tail had longest median survival times ever reported without chemotherapy. PSK and PSP (active compounds) are approved cancer treatments in Japan. Also improves gut microbiome diversity. Best for: cancer dogs, compromised immunity, chronic digestive issues, senior dogs. Dose: 25-100 mg/kg/day.

Reishi (Ganoderma lucidum): Known as the "mushroom of immortality." Contains triterpenes (anti-inflammatory) and beta-glucans. Human and animal studies show liver protection, immune modulation, anti-tumor effects. Good for: liver support, chronic inflammation, allergies, autoimmune conditions, anxiety (adaptogenic).

Lion's Mane (Hericium erinaceus): Unique among mushrooms — contains hericenones and erinacines which stimulate Nerve Growth Factor (NGF) synthesis. Studies show improved cognitive function, nerve regeneration. Best for: senior dogs with cognitive decline, nerve injuries, neurological conditions.

Chaga (Inonotus obliquus): Highest antioxidant content of any mushroom (ORAC value). Rich in betulinic acid (anti-tumor). Best for: cancer prevention/support, oxidative stress, inflammation.

Maitake (Grifola frondosa): Contains D-fraction beta-glucans. Studies show immune activation, blood sugar regulation, anti-tumor effects. Good for: diabetic dogs, cancer support, immune support.

Cordyceps (Cordyceps sinensis/militaris): Contains cordycepin. Studies show improved exercise performance, kidney protection, anti-inflammatory effects. Best for: active dogs, kidney disease, respiratory support.

Shiitake (Lentinula edodes): Contains lentinan (approved cancer treatment in Japan/China). Also rich in eritadenine (supports cardiovascular health) and ergosterol (Vitamin D precursor). Best for: immune support, cardiovascular health.`
  },
  {
    id: 'fish-oil-omega3',
    category: 'supplements',
    text: `Fish oil and omega-3s for dogs — evidence-based guide:
The three key omega-3s: EPA (eicosapentaenoic acid) — primary anti-inflammatory, directly reduces inflammatory cytokines, supports joint/skin/immune health. DHA (docosahexaenoic acid) — critical for brain development, vision, neurological function, especially important in puppies and seniors. ALA (alpha-linolenic acid) — found in flaxseed, dogs convert less than 15% to EPA/DHA — plant omega-3s are NOT adequate substitutes.

Omega-6:Omega-3 ratio matters: Most kibble = 10:1 to 25:1. Optimal = 5:1 or lower. High omega-6 is pro-inflammatory.

Clinical evidence: Joint/osteoarthritis — JAVMA randomized controlled trial showed significant improvement in weight-bearing and mobility scores. Skin/coat — multiple trials show improved coat quality, reduced itching, improved skin barrier in atopic dermatitis dogs. Kidney disease — landmark study: fish oil supplemented dogs with chronic kidney disease had significantly slower progression and longer survival times. Heart disease (DCM) — dogs with DCM have reduced EPA/DHA in heart muscle tissue. Cancer — EPA and DHA shown to slow tumor growth, reduce cachexia, improve response to chemotherapy. Brain health — DHA essential for cognitive function, reduced cognitive decline in senior dogs.

Best sources in order: Whole food small fatty fish (sardines, mackerel, anchovies, herring) — best bioavailability plus minerals and protein. Fresh fish (salmon, trout) — excellent. High-quality fish oil. Krill oil — contains astaxanthin antioxidant.

Dosing: 20-55 mg EPA+DHA per kg body weight per day for therapeutic effect. 75 lb dog = ~675-1875 mg EPA+DHA daily. Simple Food Project freeze-dried covers omega ratio at 0.85:1, reducing need for supplement.

What to avoid: Cod liver oil (can overdose Vitamins A and D). Plant-based omega-3s as primary source. Rancid fish oil (smells fishy/off — should smell mild).`
  },
  {
    id: 'probiotics-enzymes',
    category: 'supplements',
    text: `Probiotics, prebiotics, and digestive enzymes for dogs:
Digestive enzymes: Break food down for absorption. Whole foods contain natural enzymes. Kibble processing (250-300°F) destroys all enzymes. Even 118°F destroys most. Dogs on kibble have zero dietary enzymes — pancreas compensates by working overtime, leading to bloating, gas, loose stools, poor absorption over years. Supplementing with digestive enzymes (protease, amylase, lipase) is highly recommended for kibble-fed dogs.

Probiotics: Kibble heat destroys all probiotics even when added to formula. Most effective for: dogs with diarrhea (Lactobacillus), inflammatory bowel issues (Bifidobacterium), post-antibiotic recovery (Saccharomyces boulardii). Rotate strains or use multi-strain blends for gut diversity. Bacillus strains are most stable through digestive tract.

Prebiotics: Fiber that feeds beneficial bacteria. Best sources: chicory root, inulin, FOS (fructooligosaccharides), psyllium husk, Jerusalem artichoke. Small amounts of cooked sweet potato or pumpkin also work.

Best products: Adored Beast Digestive Enzymes (comprehensive blend), Native Pet Probiotic. Raw diets don't need enzyme supplements — whole food provides them naturally.

Signs of poor gut health: Chronic gas, bloating, intermittent loose stools, poor coat, food sensitivities, frequent ear infections, anal gland issues, chronic yeast infections.`
  },
  {
    id: 'green-lipped-mussel',
    category: 'supplements',
    text: `Green-lipped mussel (Perna canaliculus) for dogs:
One of the most well-researched natural joint supplements for dogs. Contains a unique combination of omega-3 fatty acids (ETA — eicosatetraenoic acid), glycosaminoglycans (chondroitin sulfate, dermatan sulfate), vitamins, minerals, and antioxidants not found together in any other single food source.
Clinical evidence: Multiple double-blind studies show significant reduction in joint pain, stiffness, and lameness scores in dogs with osteoarthritis. One study showed 80% of dogs responded positively. Works via multiple pathways: inhibits 5-LOX (leukotriene) AND COX (prostaglandin) inflammatory pathways — unlike NSAIDs which only block COX.
Best forms: Freeze-dried whole mussel (best bioavailability, maintains all active compounds). Powdered extract is second best. Oil extract loses some active compounds.
Dose: Approximately 15 mg per kg body weight per day. Takes 4-8 weeks for full effect.
Best for: arthritis, joint pain, senior dogs, high-activity dogs, post-surgery recovery, any inflammatory condition.
Key advantage over fish oil: Contains ETA omega-3 not found in fish oil, plus glycosaminoglycans for cartilage support.`
  },
  {
    id: 'dental-health-natural',
    category: 'dental',
    text: `Natural dental care for dogs:
- Raw Manuka Honey UMF 10+ — apply tiny amount directly to gums. Manuka honey has documented antimicrobial properties (methylglyoxal), reduces periodontal bacteria, reduces gum inflammation.
- Imperial Pet Deer Velvet & Manuka Oral Spray — daily application directly to gums. Combines manuka antimicrobials with deer velvet (collagen precursors for gum tissue).
- Coconut oil — occasional teeth brushing only (not daily supplement for dogs on high fat diet, risk of pancreatitis). Has antimicrobial properties against certain oral bacteria.
- Raw meaty bones (species appropriate) — best mechanical cleaning. Raw chicken necks, duck necks, turkey necks. NEVER cooked bones (splinter risk). The gnawing action scrapes tartar mechanically.
- Bully sticks, raw hide alternatives — physical chewing helps.
Avoid: Conventional dog toothpaste with fluoride or xylitol (toxic). CET toothpaste has poultry flavor but check ingredients. Most dental chews are highly processed starch with minimal cleaning effect.
Signs of dental disease: Bad breath (not just "dog breath"), red/swollen gums, brown tartar buildup, pawing at mouth, reluctance to chew.`
  },
  {
    id: 'liver-support',
    category: 'supplements',
    text: `Liver support supplements for dogs:
Milk Thistle (Silymarin): Most researched liver protectant for dogs. Silymarin stabilizes liver cell membranes, promotes liver cell regeneration, and has antioxidant effects. Clinical use: hepatitis, toxin exposure, steroid use, monthly chemical parasite prevention, vaccinosis. Dose: 50-250 mg per day depending on size.
SAMe (S-Adenosylmethionine): Supports glutathione synthesis (primary liver antioxidant). Often combined with milk thistle. Shown to improve liver enzyme levels in dogs with chronic hepatitis.
NAC (N-acetyl cysteine): Directly raises glutathione. Best for acute toxin exposure (Tylenol toxicity is treated with NAC in vets). Also supports respiratory health.
Vitamin E (natural d-Alpha tocopherol): Works synergistically with SAMe for liver protection. Important for dogs on high-fat diets.
Dandelion root: Mild liver tonic, supports bile production and fat digestion. Safe, well-tolerated.
Turmeric (with black pepper): Curcumin has anti-inflammatory and liver-protective effects. Bioavailability very low without fat and black pepper. Golden paste recipe (turmeric + coconut oil + black pepper) maximizes absorption.
Four Leaf Rover Liver & Kidney Clean: Comprehensive formula for dogs on monthly chemical parasite prevention or with lipoma management needs.`
  },
  {
    id: 'lipoma-science',
    category: 'lipomas',
    text: `Lipomas in dogs — science and management:
What lipomas are: Benign fatty tumors growing just beneath the skin. Typically soft, movable, painless. Most common in dogs aged 9-12, overweight dogs, spayed females. Overweight dogs have roughly twice the risk. Highest risk breeds: Labrador Retrievers, Weimaraners, Dobermans, Golden Retrievers, Miniature Schnauzers, Cocker Spaniels.
Infiltrative lipomas: Grow deeper into muscle tissue, don't have clean borders, can't be easily removed, come back after surgery. Any new lump should be aspirated by vet to differentiate.
Root causes: Chronic inflammation (lipoma tissue has elevated proliferating fat stem cells driven by inflammatory signals). Insulin resistance from high-starch diets (body stores more fat peripherally). Poor omega-6:omega-3 ratio (10:1 to 25:1 in most kibble vs optimal 5:1). Impaired liver function (liver is the central fat metabolism organ). Lymphatic stagnation.
Management approach: Anti-inflammatory diet (reduce omega-6, eliminate inflammatory oils and grains). Correct omega ratio (Simple Food Project, fish proteins). Liver support (Four Leaf Rover Liver & Kidney Clean, milk thistle). Reduce carbohydrates (insulin-driven fat storage mechanism). Exercise (lymphatic movement). Fish oil/omega-3s (anti-inflammatory, reduce lipoma growth rate).
Supplements that directly target lipomas: Fish oil/omega-3s, turmeric (curcumin), medicinal mushrooms (Chaga, Turkey Tail), liver support formulas. Topical castor oil massage over lipoma area reportedly reduces size in some dogs (anecdotal but low-risk).`
  },
  {
    id: 'fasting-and-longevity',
    category: 'nutrition',
    text: `Intermittent fasting and caloric restriction for dogs:
Purina Life Span Study: Restricted-calorie dogs (25% less food) lived an average of 1.8 years longer than control dogs — the most significant longevity study ever done in dogs. This has been repeatedly cited by holistic vets.
Dog Aging Project findings: Caloric restriction and intermittent fasting show similar benefits in dogs as in other mammals — reduced inflammation, improved insulin sensitivity, cellular autophagy (cellular cleanup).
Intermittent fasting for dogs: 12-16 hour overnight fast is natural and beneficial for most healthy adult dogs. Some holistic vets recommend one "fast day" per week (water only). Not appropriate for puppies, pregnant/nursing dogs, dogs with diabetes or hypoglycemia, very thin dogs.
Benefits: Activates autophagy (cellular cleanup), improves insulin sensitivity, reduces inflammation, may slow cancer progression, supports weight management.
Cancer connection: Cancer cells preferentially use glucose. Reducing carbohydrates and implementing intermittent fasting can "starve" cancer cells while healthy cells adapt to fat/ketone metabolism.
Key caveat: Fasting is NOT appropriate for dogs with bloat risk (GDV) — large breed deep-chested dogs should not exercise before/after meals, avoid feeding one large meal.`
  },
  {
    id: 'deficiencies-whole-food-diet',
    category: 'nutrition',
    text: `Nutritional deficiencies to watch on whole food diets for dogs:
Timeline: Deficiencies develop over months, not days. Annual bloodwork (CBC + chemistry panel) catches most before clinical signs appear.
Zinc: Signs — crusty nose and paw pads, dull coat, slow wound healing. High-zinc foods: beef, lamb, organ meats. Certain breeds (Huskies, Malamutes, Samoyeds) have zinc absorption issues and need supplementation.
B vitamins: Signs — low energy, dull coat, neurological signs in severe cases. B12 especially important — beef, liver, eggs are best sources. Methylcobalamin preferred over cyanocobalamin.
Vitamin D: Signs — muscle weakness (rare with good protein rotation). Whole food sources: fatty fish, egg yolk. Don't supplement with cholecalciferol (synthetic D3) — narrow safe margin.
Iron/Anemia: Signs — pale gums, lethargy, exercise intolerance. Caught on annual bloodwork CBC. Best sources: liver, heart, red meats.
Omega-3: Signs — inflammation flare-up, dry skin and coat, lipoma growth. Simple Food Project freeze-dried or regular sardines prevents this.
Calcium/Phosphorus imbalance: Main risk with home-cooked raw diet using muscle meat only without bones. NOT a risk with commercial complete-and-balanced raw or gently cooked foods.
Taurine: Signs — dilated cardiomyopathy (DCM). Heart muscle issues. Best sources: heart muscle meat, whole fish. Grain-free kibble with legumes has been associated with taurine deficiency (FDA investigation ongoing).
Annual bloodwork checklist: CBC + chemistry panel. Add thyroid panel (T4) for Labs (hypothyroid-prone). Add heartworm test (required with Heartgard).`
  },
  {
    id: 'supplement-stack-general',
    category: 'supplements',
    text: `Core holistic supplement stack for dogs — recommended by Dr. Judy Morgan, Dr. Karen Becker, Dr. Peter Dobias:
FOUNDATION (most dogs benefit):
- Digestive enzymes: Adored Beast digestive enzymes or similar broad-spectrum formula
- Probiotic: Multi-strain, rotate regularly. Native Pet Probiotic or similar
- Omega-3 (if not eating fatty fish 3x/week): Native Pet Omega, sardines in water, or high-quality fish oil
- Whole food vitamin/mineral base: Raw egg, goat milk, bone broth

FOR SENIOR DOGS (add):
- Green-lipped mussel: Joint support, 15 mg/kg/day
- Medicinal mushrooms: Turkey tail for immune, lion's mane for cognition
- CoQ10: Heart and cellular energy support

FOR DOGS WITH LIPOMAS:
- Four Leaf Rover Liver & Kidney Clean
- Fish oil/omega-3s at therapeutic dose
- Turmeric golden paste
- Reduce carbs, eliminate inflammatory oils

FOR DOGS WITH JOINT ISSUES:
- Green-lipped mussel (freeze-dried whole mussel, fruiting body)
- Fish oil (EPA+DHA at 20-55 mg/kg/day)
- Turmeric with black pepper and fat

KEY PRINCIPLE: Rotate everything. Rotating proteins, probiotic strains, and whole food toppers builds resilience and prevents nutritional gaps. Single protein/single probiotic forever = not optimal.`
  },
]

async function seed() {
  console.log(`Seeding ${knowledge.length} knowledge chunks into Pinecone...\n`)
  for (const item of knowledge) {
    await upsert(item.id, item.text, item.category)
    await new Promise(r => setTimeout(r, 500))
  }
  console.log('\n✅ All knowledge seeded successfully!')
}

seed().catch(console.error)
