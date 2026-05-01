"""
Configuration for Singapore Foreign Labour sentiment scraping project.
"""

# Search queries for all scrapers
SEARCH_QUERIES = [
    "foreign worker",
    "foreign talent",
    "CECA",
    "work permit",
    "EP holder",
    "migrant worker",
    "foreign labour",
    "foreign labor",
    "PMET foreign",
    "S pass",
    "employment pass",
    "foreign manpower",
]

# Additional queries for broader coverage
EXTRA_QUERIES = [
    "singaporean replaced",
    "locals vs foreigners singapore",
    "too many foreigners singapore",
    "singapore immigration policy",
    "expat singapore",
    "india CECA singapore",
]

# Topic classification keywords — redesigned to reflect the actual debate
TOPIC_KEYWORDS = {
    "Jobs & Competition": [
        "job", "employ", "hire", "PMET", "retrench", "career", "workplace",
        "compete", "unemploy", "retrenched", "hiring", "fired", "sacked",
        "position", "vacancy", "recruit", "headcount", "workforce",
        "replaced", "replace", "displac", "takeover", "take over",
        "local hire", "career", "resume", "interview", "applicant",
        "qualified", "skill", "experience", "promotion", "boss",
        "team lead", "manager", "colleague",
    ],
    "Policy & Government": [
        "CECA", "EP", "S Pass", "work permit", "MOM", "quota", "policy",
        "government", "regulat", "ministry", "parliament", "legislation",
        "tighten", "restrict", "fair consideration", "TAFEP", "PAP",
        "opposition", "WP ", "PSP", "SDP", "election", "GE20", "vote",
        "minister", "law", "bill", "debate", "manpower", "framework",
        "COMPASS", "foreign workforce",
    ],
    "Worker Welfare": [
        "dormitor", "dorm", "living condition", "abuse", "exploit",
        "safety", "accident", "injury", "died", "death", "killed",
        "fell", "lorry", "transport", "welfare", "rights",
        "maid", "domestic worker", "helper", "treatment",
        "wage theft", "unpaid", "overwork", "rest day",
        "medical", "hospital", "covid", "COVID", "infected",
        "cluster", "quarantine", "lockdown", "pandemic",
    ],
    "Economy & Wages": [
        "salary", "wage", "pay", "cheap labour", "underpaid", "depress wage",
        "income", "remunerat", "compensat", "low pay", "minimum wage",
        "cost cutting", "GDP", "econom", "growth", "productiv",
        "levy", "tax", "cost", "expensive", "afford", "inflation",
        "business", "company", "SME", "startup", "industry",
        "construction", "F&B", "tech", "IT sector",
    ],
    "Identity & Integration": [
        "integrat", "culture", "language", "assimilat", "identity",
        "xenophob", "racist", "racism", "discriminat", "harmony",
        "tension", "local vs foreign", "privilege", "entitle",
        "us vs them", "sinkie", "ang moh", "PR ", "citizen",
        "national", "belong", "community", "enclave", "ghetto",
        "Little India", "displace", "overcrowd", "crowd",
        "population", "birth rate", "fertility", "immigrant",
        "new citizen", "naturali", "singaporean core",
    ],
}

# Scraping settings
REQUEST_DELAY = 2  # seconds between requests for non-API scrapers
MAX_POSTS_PER_QUERY = 100  # max Reddit posts per search query
OUTPUT_DIR = "../data/raw"
