import random
from datetime import datetime, timedelta

import pandas as pd


# Fixed seed for reproducibility
random.seed(42)

usernames = [
    "citizen_01",
    "journalist_23",
    "onlooker_nyc",
    "local_voice",
    "field_reporter",
    "student_park",
    "commuter_downtown",
]

locations = ["Downtown", "City Mall", "Old Town", "Stadium", "University"]

neutral_templates = [
    "Crowds gathering near {loc}, but seems peaceful for now.",
    "Traffic is heavy around {loc}, lots of people heading home.",
    "Seeing more police presence near {loc}, nothing unusual yet.",
    "Quiet evening walk around {loc}, streets are calm.",
    "People are chanting near {loc}, mood feels mixed.",
]

tension_templates = [
    "Tear gas reported near {loc}, people are running.",
    "Multiple clashes between groups at {loc}, looks serious.",
    "Fire spotted near {loc}, smoke all over the place.",
    "Crowd trapped between police lines at {loc}, people are panicking.",
    "Riot police formed a line near {loc}, tension is rising.",
    "Loud bangs and gas smell near {loc}, something is going on.",
]


def generate_mock_tweets(n_rows: int = 200) -> pd.DataFrame:
    base_time = datetime.now() - timedelta(minutes=30)
    rows = []

    for i in range(n_rows):
        ts = base_time + timedelta(seconds=10 * i)
        username = random.choice(usernames)
        loc = random.choice(locations)

        # Decide if this tweet is calm vs tense
        if random.random() < 0.25:
            template = random.choice(tension_templates)
        else:
            template = random.choice(neutral_templates)

        text = template.format(loc=loc)

        rows.append(
            {
                "timestamp": ts.isoformat(),
                "username": username,
                "tweet_text": text,
                "location": loc,
            }
        )

    return pd.DataFrame(rows)


if __name__ == "__main__":
    df = generate_mock_tweets(250)
    df.to_csv("mock_tweets.csv", index=False)
    print("mock_tweets.csv generated with", len(df), "rows")


